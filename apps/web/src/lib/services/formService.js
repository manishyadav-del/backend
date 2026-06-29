import { BaseService } from './baseService.js';
import { createNotification } from '@/lib/notify.js';
import prisma from '@/lib/prisma.js';
import { sendEmailWithSettings } from '@/lib/email.js';

export class FormService extends BaseService {
  constructor() {
    super('formSubmission');
  }

  async getAll(projectId, queryOptions = {}) {
    const where = {};
    if (projectId && projectId !== 'all') {
      where.projectId = projectId;
    }
    if (queryOptions.formType) {
      where.formType = queryOptions.formType;
    }
    return this.findAll(where, queryOptions);
  }

  async create(data) {
    // 1. Create the form submission record
    const submission = await super.create(data);

    try {
      // 2. Lead Matching & Creation / Update
      let lead = null;
      if (data.email || data.phone) {
        const orConditions = [];
        if (data.email) orConditions.push({ email: data.email });
        if (data.phone) orConditions.push({ phone: data.phone });

        lead = await prisma.lead.findFirst({
          where: {
            projectId: data.projectId,
            OR: orConditions,
          },
        });
      }

      const noteText = data.message ? `[Form ${new Date().toLocaleDateString()}]: ${data.message}` : '';

      if (lead) {
        // Update existing Lead
        lead = await prisma.lead.update({
          where: { id: lead.id },
          data: {
            name: data.name || lead.name,
            phone: data.phone || lead.phone,
            serviceInterest: data.formType || lead.serviceInterest,
            sourcePage: data.sourcePage || lead.sourcePage,
            source: 'form',
            notes: noteText ? (lead.notes ? `${lead.notes}\n${noteText}` : noteText) : lead.notes,
          },
        });
      } else {
        // Create new Lead
        lead = await prisma.lead.create({
          data: {
            projectId: data.projectId,
            name: data.name || 'Anonymous',
            email: data.email || null,
            phone: data.phone || null,
            serviceInterest: data.formType || 'contact',
            source: 'form',
            sourcePage: data.sourcePage || null,
            notes: noteText || null,
            status: 'new',
          },
        });
      }

      // Link submission to the lead
      await prisma.formSubmission.update({
        where: { id: submission.id },
        data: { leadId: lead.id },
      });

      // 3. Generate auto-notification inside the admin dashboard
      await createNotification(
        submission.projectId,
        'lead',
        'New Lead / Form Submission',
        `Received a new ${submission.formType || 'contact'} submission from ${submission.name || submission.email || 'Anonymous'}.`,
        '/admin/leads'
      );

      // 4. SMTP Notification Alerts & Auto-Responders
      const emailSettings = await prisma.emailSetting.findUnique({
        where: { projectId: submission.projectId },
      });

      if (emailSettings && emailSettings.smtpHost && emailSettings.smtpUser && emailSettings.smtpPass) {
        // A. Send administrator alert if enabled
        if (emailSettings.adminAlerts) {
          const adminToEmail = emailSettings.formEmail || emailSettings.smtpUser;
          const adminSubject = `⚡ [Global Backend] New Lead Alert: ${submission.name || 'Anonymous'}`;
          const adminHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; color: #1e293b;">
              <h2 style="color: #4f46e5; margin-top: 0;">New Lead Submission</h2>
              <p>You have received a new form submission on your website.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9; width: 140px;">Form Type</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${submission.formType || 'contact'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Name</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${submission.name || 'Anonymous'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Email</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${submission.email || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Phone</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${submission.phone || 'N/A'}</td>
                </tr>
                ${submission.message ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9; vertical-align: top;">Message</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; white-space: pre-wrap;">${submission.message}</td>
                </tr>
                ` : ''}
              </table>
              <div style="text-align: center; margin-top: 24px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/leads" style="display: inline-block; background-color: #4f46e5; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 14px;">
                  View Lead on Dashboard
                </a>
              </div>
            </div>
          `;

          await sendEmailWithSettings(emailSettings, {
            to: adminToEmail,
            subject: adminSubject,
            html: adminHtml,
          }).catch(err => console.error('[FormService] Failed to send admin email alert:', err.message));
        }

        // B. Send user auto-reply template if configured and user has an email
        if (emailSettings.autoReplyTemplate && submission.email) {
          const userSubject = `Thank you for contacting us!`;
          // Simple interpolation: replace {name} with submission name
          const userHtml = emailSettings.autoReplyTemplate
            .replace(/{name}/g, submission.name || 'there')
            .replace(/{email}/g, submission.email)
            .replace(/{formType}/g, submission.formType || 'submission');

          await sendEmailWithSettings(emailSettings, {
            to: submission.email,
            subject: userSubject,
            html: userHtml,
          }).catch(err => console.error('[FormService] Failed to send user auto-reply email:', err.message));
        }
      }
    } catch (err) {
      console.error('[FormService] Post-submission hook failed:', err);
    }

    return submission;
  }
}

export const formService = new FormService();
export default formService;
