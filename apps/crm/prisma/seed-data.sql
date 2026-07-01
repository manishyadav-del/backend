-- ============================================================================
-- GOBAL BACKEND - SAMPLE SEED DATA
-- ============================================================================
-- Database: MySQL
-- Usage: mysql -u your_user -p your_database_name < seed-data.sql
-- ============================================================================

-- ============================================================================
-- 1. INSERT ADMIN USER
-- ============================================================================
-- Password: admin123 (bcrypt hash - generate a real one for production)
INSERT INTO `User` (`id`, `email`, `password`, `name`, `role`, `avatar`, `twoFactorEnabled`, `createdAt`, `updatedAt`)
VALUES (
  'clx1234567890abcdef01',
  'admin@gobal.com',
  '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQkfAjkMBcGm1smX5n5y5O5e5i5OC',
  'Admin User',
  'admin',
  NULL,
  false,
  NOW(),
  NOW()
);

-- ============================================================================
-- 2. INSERT DEMO PROJECT
-- ============================================================================
INSERT INTO `Project` (`id`, `name`, `domain`, `apiKey`, `description`, `logo`, `favicon`, `brandColor`, `status`, `createdAt`, `updatedAt`)
VALUES (
  'clx1234567890abcdef02',
  'Gobal Main Website',
  'gobal.com',
  'gbl_api_key_main_2024',
  'Main business website for Gobal - digital solutions provider',
  '/uploads/logo.png',
  '/uploads/favicon.ico',
  '#3b82f6',
  'active',
  NOW(),
  NOW()
);

-- ============================================================================
-- 3. INSERT PAGES
-- ============================================================================
-- Home Page
INSERT INTO `Page` (`id`, `projectId`, `title`, `slug`, `path`, `status`, `content`, `sections`, `banner`, `template`, `sortOrder`, `isHome`, `createdAt`, `updatedAt`, `publishedAt`, `visibility`)
VALUES (
  'clx1234567890abcdef03',
  'clx1234567890abcdef02',
  'Home',
  'home',
  '/',
  'published',
  '[{"type":"hero","content":"Welcome to Gobal"},{"type":"services","content":"Our Services"}]',
  '[{"type":"hero","title":"Welcome to Gobal"},{"type":"services","title":"What We Offer"}]',
  '/uploads/home-banner.jpg',
  'default',
  0,
  true,
  NOW(),
  NOW(),
  NOW(),
  'public'
);

-- About Page
INSERT INTO `Page` (`id`, `projectId`, `title`, `slug`, `path`, `status`, `content`, `banner`, `sortOrder`, `isHome`, `createdAt`, `updatedAt`, `publishedAt`, `visibility`)
VALUES (
  'clx1234567890abcdef04',
  'clx1234567890abcdef02',
  'About Us',
  'about',
  '/about',
  'published',
  '[{"type":"about","content":"About Gobal Company"}]',
  '/uploads/about-banner.jpg',
  1,
  false,
  NOW(),
  NOW(),
  NOW(),
  'public'
);

-- ============================================================================
-- 4. INSERT SEO DATA
-- ============================================================================
-- SEO for Home Page
INSERT INTO `SEO` (`id`, `pageId`, `metaTitle`, `metaDescription`, `urlSlug`, `canonical`, `ogImage`, `robots`, `createdAt`, `updatedAt`)
VALUES (
  'clx1234567890abcdef05',
  'clx1234567890abcdef03',
  'Gobal - Digital Solutions for Your Business',
  'Gobal provides cutting-edge digital solutions including web development, SEO, and marketing services.',
  'home',
  'https://gobal.com',
  '/uploads/og-home.jpg',
  'index, follow',
  NOW(),
  NOW()
);

-- SEO for About Page
INSERT INTO `SEO` (`id`, `pageId`, `metaTitle`, `metaDescription`, `urlSlug`, `canonical`, `robots`, `createdAt`, `updatedAt`)
VALUES (
  'clx1234567890abcdef06',
  'clx1234567890abcdef04',
  'About Gobal - Our Story & Team',
  'Learn about Gobal, our mission, vision, and the team behind our digital solutions.',
  'about',
  'https://gobal.com/about',
  'index, follow',
  NOW(),
  NOW()
);

-- ============================================================================
-- 5. INSERT SERVICES
-- ============================================================================
INSERT INTO `Service` (`id`, `projectId`, `title`, `description`, `image`, `ctaText`, `ctaLink`, `sortOrder`, `isVisible`, `createdAt`, `updatedAt`)
VALUES
(
  'clx1234567890abcdef07',
  'clx1234567890abcdef02',
  'Web Development',
  'Custom web applications built with modern technologies like React, Next.js, and Node.js.',
  '/uploads/services/web-dev.jpg',
  'Learn More',
  '/services/web-development',
  1,
  true,
  NOW(),
  NOW()
),
(
  'clx1234567890abcdef08',
  'clx1234567890abcdef02',
  'SEO Optimization',
  'Improve your search engine rankings with our comprehensive SEO strategies.',
  '/uploads/services/seo.jpg',
  'Get Started',
  '/services/seo',
  2,
  true,
  NOW(),
  NOW()
),
(
  'clx1234567890abcdef09',
  'clx1234567890abcdef02',
  'Digital Marketing',
  'Full-funnel digital marketing campaigns that drive results and grow your business.',
  '/uploads/services/marketing.jpg',
  'Explore',
  '/services/digital-marketing',
  3,
  true,
  NOW(),
  NOW()
);

-- ============================================================================
-- 6. INSERT BLOG POSTS
-- ============================================================================
INSERT INTO `Blog` (`id`, `projectId`, `title`, `content`, `excerpt`, `slug`, `category`, `featuredImage`, `author`, `status`, `publishedAt`, `seoTitle`, `seoDescription`, `createdAt`, `updatedAt`)
VALUES
(
  'clx1234567890abcdef10',
  'clx1234567890abcdef02',
  'Top Web Development Trends in 2024',
  'Full blog content about web development trends for 2024...',
  'Discover the latest web development trends shaping the digital landscape in 2024.',
  'top-web-development-trends-2024',
  'Technology',
  '/uploads/blog/web-trends.jpg',
  'Admin User',
  'published',
  NOW(),
  'Web Development Trends 2024 | Gobal Blog',
  'Stay ahead with the latest web development trends. Learn about AI, PWAs, and more.',
  NOW(),
  NOW()
),
(
  'clx1234567890abcdef11',
  'clx1234567890abcdef02',
  'How to Improve Your SEO Rankings',
  'Full blog content about SEO improvement strategies...',
  'Learn proven strategies to boost your search engine rankings and drive organic traffic.',
  'improve-seo-rankings',
  'SEO',
  '/uploads/blog/seo-tips.jpg',
  'Admin User',
  'published',
  NOW(),
  'SEO Ranking Tips | Gobal Blog',
  'Practical tips to improve your SEO rankings and increase organic traffic to your website.',
  NOW(),
  NOW()
);

-- ============================================================================
-- 7. INSERT TESTIMONIALS
-- ============================================================================
INSERT INTO `Testimonial` (`id`, `projectId`, `clientName`, `clientImage`, `rating`, `content`, `isVisible`, `sortOrder`, `createdAt`, `updatedAt`)
VALUES
(
  'clx1234567890abcdef12',
  'clx1234567890abcdef02',
  'Rahul Sharma',
  '/uploads/testimonials/rahul.jpg',
  5,
  'Gobal transformed our online presence. Our traffic increased by 300% in just 3 months!',
  true,
  1,
  NOW(),
  NOW()
),
(
  'clx1234567890abcdef13',
  'clx1234567890abcdef02',
  'Priya Patel',
  '/uploads/testimonials/priya.jpg',
  5,
  'The team at Gobal is incredibly professional. They delivered our website ahead of schedule.',
  true,
  2,
  NOW(),
  NOW()
),
(
  'clx1234567890abcdef14',
  'clx1234567890abcdef02',
  'Amit Verma',
  '/uploads/testimonials/amit.jpg',
  4,
  'Excellent SEO services. We are now ranking #1 for our target keywords.',
  true,
  3,
  NOW(),
  NOW()
);

-- ============================================================================
-- 8. INSERT FAQS
-- ============================================================================
INSERT INTO `FAQ` (`id`, `projectId`, `pageId`, `serviceId`, `question`, `answer`, `sortOrder`, `isVisible`, `createdAt`, `updatedAt`)
VALUES
(
  'clx1234567890abcdef15',
  'clx1234567890abcdef02',
  NULL,
  'clx1234567890abcdef07',
  'How long does it take to build a website?',
  'Typical website development takes 4-8 weeks depending on complexity and requirements.',
  1,
  true,
  NOW(),
  NOW()
),
(
  'clx1234567890abcdef16',
  'clx1234567890abcdef02',
  NULL,
  'clx1234567890abcdef07',
  'Do you provide website maintenance?',
  'Yes, we offer monthly maintenance packages that include updates, backups, and security patches.',
  2,
  true,
  NOW(),
  NOW()
),
(
  'clx1234567890abcdef17',
  'clx1234567890abcdef02',
  NULL,
  'clx1234567890abcdef08',
  'How long before I see SEO results?',
  'SEO is a long-term strategy. Most clients see significant improvements within 3-6 months.',
  1,
  true,
  NOW(),
  NOW()
),
(
  'clx1234567890abcdef18',
  'clx1234567890abcdef02',
  'clx1234567890abcdef03',
  NULL,
  'What services does Gobal offer?',
  'Gobal offers web development, SEO optimization, digital marketing, and IT consulting services.',
  1,
  true,
  NOW(),
  NOW()
);

-- ============================================================================
-- 9. INSERT TEAM MEMBERS
-- ============================================================================
INSERT INTO `TeamMember` (`id`, `projectId`, `name`, `role`, `photo`, `bio`, `socialLinks`, `sortOrder`, `isVisible`, `createdAt`, `updatedAt`)
VALUES
(
  'clx1234567890abcdef19',
  'clx1234567890abcdef02',
  'Vikram Singh',
  'CEO & Founder',
  '/uploads/team/vikram.jpg',
  'Visionary leader with 15+ years in the digital industry.',
  '{"linkedin":"https://linkedin.com/in/vikram","twitter":"https://twitter.com/vikram"}',
  1,
  true,
  NOW(),
  NOW()
),
(
  'clx1234567890abcdef20',
  'clx1234567890abcdef02',
  'Ananya Gupta',
  'Lead Developer',
  '/uploads/team/ananya.jpg',
  'Full-stack developer specializing in React and Node.js ecosystems.',
  '{"linkedin":"https://linkedin.com/in/ananya","github":"https://github.com/ananya"}',
  2,
  true,
  NOW(),
  NOW()
),
(
  'clx1234567890abcdef21',
  'clx1234567890abcdef02',
  'Rohit Mehta',
  'SEO Specialist',
  '/uploads/team/rohit.jpg',
  'SEO expert with proven track record of ranking websites #1 on Google.',
  '{"linkedin":"https://linkedin.com/in/rohit"}',
  3,
  true,
  NOW(),
  NOW()
);

-- ============================================================================
-- 10. INSERT CONTACT DETAILS
-- ============================================================================
INSERT INTO `Contact` (`id`, `projectId`, `type`, `label`, `value`, `icon`, `sortOrder`, `createdAt`)
VALUES
(
  'clx1234567890abcdef22',
  'clx1234567890abcdef02',
  'email',
  'Email',
  'contact@gobal.com',
  'fas fa-envelope',
  1,
  NOW()
),
(
  'clx1234567890abcdef23',
  'clx1234567890abcdef02',
  'phone',
  'Phone',
  '+91-98765-43210',
  'fas fa-phone',
  2,
  NOW()
),
(
  'clx1234567890abcdef24',
  'clx1234567890abcdef02',
  'address',
  'Office Address',
  '123, Tech Park, Sector 62, Noida, Uttar Pradesh - 201301',
  'fas fa-map-marker-alt',
  3,
  NOW()
),
(
  'clx1234567890abcdef25',
  'clx1234567890abcdef02',
  'hours',
  'Business Hours',
  'Mon - Fri: 9:00 AM - 6:00 PM',
  'fas fa-clock',
  4,
  NOW()
);

-- ============================================================================
-- 11. INSERT NAVIGATION (MAIN MENU)
-- ============================================================================
INSERT INTO `Navigation` (`id`, `projectId`, `location`, `items`, `createdAt`, `updatedAt`)
VALUES (
  'clx1234567890abcdef26',
  'clx1234567890abcdef02',
  'main',
  '[{"label":"Home","path":"/"},{"label":"About","path":"/about"},{"label":"Services","path":"/services","children":[{"label":"Web Development","path":"/services/web-development"},{"label":"SEO","path":"/services/seo"},{"label":"Digital Marketing","path":"/services/digital-marketing"}]},{"label":"Blog","path":"/blog"},{"label":"Contact","path":"/contact"}]',
  NOW(),
  NOW()
);

-- ============================================================================
-- 12. INSERT LEGAL PAGES
-- ============================================================================
INSERT INTO `LegalPage` (`id`, `projectId`, `type`, `title`, `content`, `createdAt`, `updatedAt`)
VALUES
(
  'clx1234567890abcdef27',
  'clx1234567890abcdef02',
  'privacy',
  'Privacy Policy',
  'Full privacy policy content...',
  NOW(),
  NOW()
),
(
  'clx1234567890abcdef28',
  'clx1234567890abcdef02',
  'terms',
  'Terms & Conditions',
  'Full terms and conditions content...',
  NOW(),
  NOW()
);

-- ============================================================================
-- 13. INSERT SAMPLE FORM SUBMISSION
-- ============================================================================
INSERT INTO `FormSubmission` (`id`, `projectId`, `formType`, `name`, `email`, `phone`, `message`, `status`, `createdAt`)
VALUES (
  'clx1234567890abcdef29',
  'clx1234567890abcdef02',
  'contact',
  'Sneha Kapoor',
  'sneha@example.com',
  '+91-9988776655',
  'Interested in your web development services for my e-commerce startup.',
  'new',
  NOW()
);

-- ============================================================================
-- 14. INSERT LEADS
-- ============================================================================
INSERT INTO `Lead` (`id`, `projectId`, `name`, `email`, `phone`, `serviceInterest`, `sourcePage`, `source`, `status`, `notes`, `createdAt`, `updatedAt`)
VALUES
(
  'clx1234567890abcdef30',
  'clx1234567890abcdef02',
  'Sneha Kapoor',
  'sneha@example.com',
  '+91-9988776655',
  'Web Development',
  '/services',
  'form',
  'new',
  'Looking for e-commerce solution with payment integration.',
  NOW(),
  NOW()
),
(
  'clx1234567890abcdef31',
  'clx1234567890abcdef02',
  'Deepak Joshi',
  'deepak@example.com',
  '+91-8877665544',
  'SEO',
  '/contact',
  'form',
  'contacted',
  'Interested in local SEO services for his restaurant business.',
  NOW(),
  NOW()
);

-- ============================================================================
-- 15. INSERT GLOBAL SETTINGS
-- ============================================================================
INSERT INTO `GlobalSetting` (`id`, `projectId`, `logo`, `favicon`, `brandColor`, `headerSettings`, `footerSettings`, `maintenanceMode`, `defaultContact`, `analytics`, `cookieConsent`, `createdAt`, `updatedAt`)
VALUES (
  'clx1234567890abcdef32',
  'clx1234567890abcdef02',
  '/uploads/logo.png',
  '/uploads/favicon.ico',
  '#3b82f6',
  '{"sticky":true,"showCTA":true,"ctaText":"Get Started"}',
  '{"showNewsletter":true,"columns":3}',
  false,
  '{"email":"contact@gobal.com","phone":"+91-98765-43210"}',
  '{"gaId":"G-XXXXXXXXXX","clarityId":"abc123def"}',
  true,
  NOW(),
  NOW()
);