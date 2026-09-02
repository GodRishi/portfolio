import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = process.env.VITE_SITE_URL || 'https://rishisaha.dev';
const currentDate = new Date().toISOString();

const routes = [
  { path: '', priority: '1.0', changefreq: 'weekly' },
  { path: 'privacy-policy.html', priority: '0.3', changefreq: 'monthly' },
  { path: 'terms-of-service.html', priority: '0.3', changefreq: 'monthly' },
  { path: 'cookie-policy.html', priority: '0.3', changefreq: 'monthly' }
];

const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) => `  <url>
    <loc>${SITE_URL}/${r.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapContent, 'utf8');
console.log('✓ sitemap.xml generated successfully in /public!');
