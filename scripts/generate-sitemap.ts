#!/usr/bin/env node
/**
 * Auto-generates sitemap.xml from live GPU data.
 * Runs after every build: `npm run build` → `npm run sitemap`
 *
 * Generates URLs for:
 *  - Static pages (/, /trends, /recipes, /api-docs, /about)
 *  - /gpu/[model]  — one per unique GPU model
 *  - /provider/[slug] — one per provider
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE  = path.join(__dirname, '../public/gpu-data.json');
const DIST_DIR   = path.join(__dirname, '../dist');
const PUBLIC_DIR = path.join(__dirname, '../public');
const BASE_URL   = 'https://gpu-tracker.dev';

function modelToSlug(model: string): string {
  return model.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function providerToSlug(provider: string): string {
  return provider.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function url(loc: string, changefreq: string, priority: string, lastmod?: string): string {
  return `  <url>
    <loc>${BASE_URL}${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
  </url>`;
}

async function generate() {
  // Read GPU data
  if (!fs.existsSync(DATA_FILE)) {
    console.error('gpu-data.json not found. Run the data fetcher first.');
    process.exit(1);
  }

  const raw  = fs.readFileSync(DATA_FILE, 'utf-8');
  const data: any[] = JSON.parse(raw);

  const models    = [...new Set(data.map((d: any) => d.model as string))].sort();
  const providers = [...new Set(data.map((d: any) => d.provider as string))].sort();
  const today     = new Date().toISOString().split('T')[0];

  const urls: string[] = [];

  // Static pages
  urls.push(url('/',         'hourly',  '1.0', today));
  urls.push(url('/trends',   'daily',   '0.8', today));
  urls.push(url('/recipes',  'weekly',  '0.7', today));
  urls.push(url('/api-docs', 'monthly', '0.6', today));
  urls.push(url('/about',    'monthly', '0.5', today));
  urls.push(url('/pricing',  'weekly',  '0.6', today));

  // GPU model pages
  for (const model of models) {
    urls.push(url(`/gpu/${modelToSlug(model)}`, 'hourly', '0.9', today));
  }

  // Provider pages
  for (const provider of providers) {
    urls.push(url(`/provider/${providerToSlug(provider)}`, 'hourly', '0.8', today));
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.join('\n')}
</urlset>`;

  // Write to both /public and /dist
  const targets = [PUBLIC_DIR, DIST_DIR].filter(fs.existsSync);
  for (const dir of targets) {
    fs.writeFileSync(path.join(dir, 'sitemap.xml'), sitemap, 'utf-8');
  }

  console.log(`✅ Sitemap generated: ${urls.length} URLs`);
  console.log(`   ${models.length} GPU model pages`);
  console.log(`   ${providers.length} provider pages`);
  console.log(`   Saved to: ${targets.join(', ')}`);
}

generate().catch(console.error);
