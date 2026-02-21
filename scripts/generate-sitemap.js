#!/usr/bin/env node
/**
 * Auto-generates /public/sitemap.xml and /dist/sitemap.xml from gpu-data.json.
 * Runs automatically after every `npm run build`.
 */

import * as fs   from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE  = path.join(__dirname, '../public/gpu-data.json');
const PUBLIC_DIR = path.join(__dirname, '../public');
const DIST_DIR   = path.join(__dirname, '../dist');
const BASE_URL   = 'https://gpu-tracker.dev';

function slug(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function urlEntry(loc, changefreq, priority, lastmod) {
  return `  <url>
    <loc>${BASE_URL}${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
  </url>`;
}

function generate() {
  if (!fs.existsSync(DATA_FILE)) {
    console.warn('gpu-data.json not found — skipping sitemap generation');
    return;
  }

  const raw      = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const data     = Array.isArray(raw) ? raw : (raw.data ?? []);
  const models   = [...new Set(data.map(d => d.model))].sort();
  const providers = [...new Set(data.map(d => d.provider))].sort();
  const today    = new Date().toISOString().split('T')[0];

  const entries = [
    // Static pages
    urlEntry('/',         'hourly',  '1.0', today),
    urlEntry('/trends',   'daily',   '0.8', today),
    urlEntry('/recipes',  'weekly',  '0.7', today),
    urlEntry('/pricing',  'weekly',  '0.6', today),
    urlEntry('/api-docs', 'monthly', '0.6', today),
    urlEntry('/about',    'monthly', '0.5', today),

    // GPU model pages — one per unique model
    ...models.map(m => urlEntry(`/gpu/${slug(m)}`,        'hourly', '0.9', today)),

    // Provider pages — one per provider
    ...providers.map(p => urlEntry(`/provider/${slug(p)}`, 'hourly', '0.8', today)),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${entries.join('\n')}
</urlset>`;

  // Write to public/ (dev) and dist/ (production build)
  const targets = [PUBLIC_DIR, DIST_DIR].filter(fs.existsSync);
  for (const dir of targets) {
    fs.writeFileSync(path.join(dir, 'sitemap.xml'), sitemap, 'utf-8');
  }

  // Also add robots.txt if it doesn't exist
  const robotsPath = path.join(PUBLIC_DIR, 'robots.txt');
  if (!fs.existsSync(robotsPath)) {
    fs.writeFileSync(robotsPath, `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`);
    console.log('  Created robots.txt');
  }

  console.log(`✅ sitemap.xml — ${entries.length} URLs (${models.length} GPU pages + ${providers.length} provider pages)`);
}

generate();
