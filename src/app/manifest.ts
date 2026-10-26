import type { MetadataRoute } from 'next';
import { asset } from '@/lib/asset';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Chest & Run Companion',
    short_name: 'Chest & Run',
    start_url: asset('/'),
    scope: asset('/'),
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    icons: [{ src: asset('/icon.svg'), sizes: 'any', type: 'image/svg+xml' }],
  };
}
