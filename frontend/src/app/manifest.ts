import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nexora AI Marketplace',
    short_name: 'Nexora',
    description: 'Intelligence, Automated. Elite autonomous agent control center.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#05050f',
    theme_color: '#6366f1',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
