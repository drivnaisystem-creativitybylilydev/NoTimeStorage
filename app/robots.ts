import type { MetadataRoute } from 'next';

const BASE = 'https://notimestorage.co';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/', '/api/', '/auth/callback', '/auth/update-password'],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
