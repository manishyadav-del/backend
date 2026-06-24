import fs from 'fs';
import path from 'path';

/**
 * Automatically detects the framework, version, build system, and routing system of the project.
 * @param {string} [projectDir] - The root folder of the project. Defaults to process.cwd().
 * @returns {object} The detected framework metadata.
 */
export function detectFramework(projectDir = process.cwd()) {
  const result = {
    framework: 'unknown',
    version: 'unknown',
    buildSystem: 'unknown',
    routeSystem: 'unknown'
  };

  try {
    // 1. Check for WordPress
    if (
      fs.existsSync(path.join(projectDir, 'wp-config.php')) ||
      fs.existsSync(path.join(projectDir, 'wp-content')) ||
      fs.existsSync(path.join(projectDir, 'wp-includes'))
    ) {
      result.framework = 'wordpress';
      result.routeSystem = 'wp-rewrite';
      result.buildSystem = 'php';
      result.version = '6.x';
      return result;
    }

    // 2. Check for Laravel
    if (
      fs.existsSync(path.join(projectDir, 'artisan')) &&
      fs.existsSync(path.join(projectDir, 'composer.json'))
    ) {
      result.framework = 'laravel';
      result.buildSystem = 'vite';
      result.routeSystem = 'laravel-web-routes';
      try {
        const composer = JSON.parse(fs.readFileSync(path.join(projectDir, 'composer.json'), 'utf8'));
        const deps = { ...(composer.require || {}), ...(composer['require-dev'] || {}) };
        if (deps['laravel/framework']) {
          result.version = deps['laravel/framework'].replace(/[^0-9.]/g, '');
        }
        if (deps['laravel/mix']) {
          result.buildSystem = 'mix';
        }
      } catch (e) {
        // Fallback for parsing error
        result.version = '10.x';
      }
      return result;
    }

    // 3. Node-based projects check package.json
    const packageJsonPath = path.join(projectDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

      // Next.js detection
      if (deps['next']) {
        result.framework = 'nextjs';
        result.version = deps['next'].replace(/[^0-9.]/g, '') || '15.0.0';
        result.buildSystem = 'next';
        
        // App Router vs Pages Router check
        const hasAppDir =
          fs.existsSync(path.join(projectDir, 'app')) ||
          fs.existsSync(path.join(projectDir, 'src', 'app'));
        const hasPagesDir =
          fs.existsSync(path.join(projectDir, 'pages')) ||
          fs.existsSync(path.join(projectDir, 'src', 'pages'));
        
        if (hasAppDir && hasPagesDir) {
          result.routeSystem = 'nextjs-hybrid-router';
        } else if (hasAppDir) {
          result.routeSystem = 'nextjs-app-router';
        } else if (hasPagesDir) {
          result.routeSystem = 'nextjs-pages-router';
        } else {
          result.routeSystem = 'nextjs-pages-router'; // fallback
        }
        return result;
      }

      // Express detection
      if (deps['express']) {
        result.framework = 'express';
        result.version = deps['express'].replace(/[^0-9.]/g, '') || '4.x';
        result.buildSystem = 'node';
        result.routeSystem = 'express-router';
        return result;
      }

      // Vite / React detection
      if (deps['vite']) {
        result.buildSystem = 'vite';
        if (deps['react']) {
          result.framework = 'react';
          result.version = deps['react'].replace(/[^0-9.]/g, '') || '19.0.0';
          result.routeSystem = deps['react-router-dom'] ? 'react-router' : 'custom';
        } else {
          result.framework = 'vite';
          result.version = deps['vite'].replace(/[^0-9.]/g, '') || '5.x';
          result.routeSystem = 'file-based';
        }
        return result;
      }

      // Plain React
      if (deps['react']) {
        result.framework = 'react';
        result.version = deps['react'].replace(/[^0-9.]/g, '') || '19.0.0';
        result.buildSystem = deps['react-scripts'] ? 'webpack-cra' : 'webpack';
        result.routeSystem = deps['react-router-dom'] ? 'react-router' : 'custom';
        return result;
      }
    }
  } catch (err) {
    // Safe error recovery
    console.warn('[SDK Framework Detector] Error detecting framework, falling back to defaults:', err.message);
  }

  return result;
}
