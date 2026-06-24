import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing Auth Header' }, { status: 401 });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid Token' }, { status: 401 });
    }

    const body = await request.json();
    const { websiteId, components } = body;

    if (!websiteId || !Array.isArray(components)) {
      return NextResponse.json({ success: false, error: 'websiteId and components array are required' }, { status: 400 });
    }

    if (decoded.websiteId !== websiteId) {
      return NextResponse.json({ success: false, error: 'Forbidden: Website ID mismatch' }, { status: 403 });
    }

    const website = await prisma.website.findUnique({ where: { id: websiteId } });
    if (!website) {
      return NextResponse.json({ success: false, error: 'Website not found' }, { status: 404 });
    }

    const registered = await Promise.all(
      components.map(async (comp) => {
        const { name, filePath, route, props, componentType } = comp;

        // Try to find if component exists
        const existing = await prisma.websiteComponent.findUnique({
          where: {
            websiteId_name_route: { websiteId, name, route: route || '/' }
          }
        });

        // Map default visual data based on component name if not already configured
        let defaultData = existing?.data || '{}';
        if (!existing) {
          const lowerName = name.toLowerCase();
          const mockData = {
            title: `Dynamic ${name}`,
            subtitle: 'Configured from Global Backend',
            description: 'This text can be edited directly from the administrator dashboard and updates in real time.',
            buttonText: 'Get Started',
            theme: 'light',
            backgroundColor: '#ffffff',
            textColor: '#1f2937'
          };

          if (lowerName.includes('hero')) {
            mockData.title = 'Welcome to Our Premium Platform';
            mockData.subtitle = 'We build beautiful digital products.';
            mockData.buttonText = 'Explore Features';
            mockData.backgroundColor = '#4f46e5';
            mockData.textColor = '#ffffff';
          } else if (lowerName.includes('testimonial')) {
            mockData.title = 'What Our Clients Say';
            mockData.testimonials = [
              { quote: 'Global Backend transformed our development speed completely.', author: 'Sarah Jenkins, CEO', rating: 5 },
              { quote: 'Implementing dynamic content blocks took less than 10 minutes.', author: 'David Chen, CTO', rating: 5 }
            ];
          } else if (lowerName.includes('faq')) {
            mockData.title = 'Frequently Asked Questions';
            mockData.faqs = [
              { question: 'How does real-time sync work?', answer: 'It is built on top of WebSockets using Socket.io to push state updates instantly.' },
              { question: 'Is the SDK compatible with React 19?', answer: 'Yes! It fully supports React 19 and Next.js 15 environments.' }
            ];
          } else if (lowerName.includes('feature')) {
            mockData.title = 'Powerful Features Built-In';
            mockData.features = [
              { title: 'Dynamic Blocks', description: 'Modify and reorder sections inline without coding.' },
              { title: 'Lead Capture', description: 'Collect email submissions directly into a premium contacts registry.' }
            ];
          }

          defaultData = JSON.stringify(mockData);
        }

        return await prisma.websiteComponent.upsert({
          where: {
            websiteId_name_route: { websiteId, name, route: route || '/' }
          },
          update: {
            filePath: filePath || 'src/components',
            componentType: componentType || 'Section',
            props: props ? JSON.stringify(props) : undefined,
            updatedAt: new Date()
          },
          create: {
            websiteId,
            name,
            filePath: filePath || 'src/components',
            route: route || '/',
            componentType: componentType || 'Section',
            props: props ? JSON.stringify(props) : '[]',
            data: defaultData,
            status: 'active'
          }
        });
      })
    );

    // SyncLog
    await prisma.syncLog.create({
      data: {
        websiteId,
        action: 'SYNC_COMPONENTS',
        status: 'success',
        details: `Synchronized ${components.length} components from client.`
      }
    });

    return NextResponse.json({
      success: true,
      count: registered.length,
      message: 'Components synchronized successfully.'
    });

  } catch (error) {
    console.error('[API Components Sync] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
