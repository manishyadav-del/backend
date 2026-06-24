import fs from 'fs';
import path from 'path';

export const SUPPORTED_MODULES = [
  'content',      // Content Management (CMS)
  'marketing',    // Marketing
  'analytics',    // Analytics (GA, Clarity)
  'builder',      // Website Builder
  'seo',          // Search Engine Optimization
  'users',        // User Management
  'system',       // System / Settings
  'security',     // Access Controls / Audit Logs
  'reputation',   // FAQ, Testimonials
  'legal'         // Legal pages, terms
];

/**
 * Checks if a specific module is active on the external site.
 * @param {object|array} activeModules - Configured modules payload.
 * @param {string} key - Module key to check (e.g. 'seo').
 * @returns {boolean}
 */
export function isModuleEnabled(activeModules, key) {
  if (!activeModules) return false;
  
  if (Array.isArray(activeModules)) {
    return activeModules.some(m => {
      if (typeof m === 'string') return m === key;
      return m.key === key && m.status === 'enabled';
    });
  }
  
  if (typeof activeModules === 'object') {
    return activeModules[key] === 'enabled' || activeModules[key] === true;
  }
  
  return false;
}

/**
 * Scans the project directory to auto-discover active modules.
 * Finds references to Header, Footer, SEO, Media, Blogs/Posts, FAQ/Testimonials.
 * @param {string} projectDir - Project root folder.
 * @returns {Promise<string[]>} List of discovered module keys.
 */
export async function discoverSiteModules(projectDir = process.cwd()) {
  const discovered = new Set(['content']); // content is always active

  try {
    // Directories to check
    const dirsToCheck = [
      path.join(projectDir),
      path.join(projectDir, 'src'),
      path.join(projectDir, 'components'),
      path.join(projectDir, 'src', 'components'),
      path.join(projectDir, 'app'),
      path.join(projectDir, 'src', 'app'),
      path.join(projectDir, 'pages'),
      path.join(projectDir, 'src', 'pages')
    ];

    const fileNames = [];
    for (const dir of dirsToCheck) {
      if (fs.existsSync(dir)) {
        try {
          const files = await fs.promises.readdir(dir);
          fileNames.push(...files.map(f => f.toLowerCase()));
        } catch (e) {}
      }
    }

    const allFilesStr = fileNames.join(' ');

    // 1. Detect SEO module
    if (allFilesStr.includes('seo') || allFilesStr.includes('meta') || fs.existsSync(path.join(projectDir, 'app', 'layout.tsx')) || fs.existsSync(path.join(projectDir, 'src', 'app', 'layout.tsx'))) {
      discovered.add('seo');
    }

    // 2. Detect Builder (Header, Footer, Navigation)
    if (allFilesStr.includes('header') || allFilesStr.includes('footer') || allFilesStr.includes('nav') || allFilesStr.includes('menu')) {
      discovered.add('builder');
    }

    // 3. Detect Reputation (FAQ, Testimonials)
    if (allFilesStr.includes('faq') || allFilesStr.includes('testimonial') || allFilesStr.includes('review')) {
      discovered.add('reputation');
    }

    // 4. Detect Legal
    if (allFilesStr.includes('privacy') || allFilesStr.includes('terms') || allFilesStr.includes('legal') || allFilesStr.includes('cookie')) {
      discovered.add('legal');
    }

    // 5. Detect Analytics
    if (allFilesStr.includes('gtag') || allFilesStr.includes('analytics') || allFilesStr.includes('clarity') || allFilesStr.includes('pixel')) {
      discovered.add('analytics');
    }

    // 6. Detect System / Email configurations
    if (fs.existsSync(path.join(projectDir, '.env')) || fs.existsSync(path.join(projectDir, '.env.local'))) {
      discovered.add('system');
    }
  } catch (err) {
    console.warn('[SDK Module Discovery] Error reading project files for module scan:', err.message);
  }

  return Array.from(discovered);
}
