import type { CapacitorConfig } from '@capacitor/cli';

// The Android app bundles the static export (`npm run build` -> out/) so it works offline.
const config: CapacitorConfig = {
  appId: 'com.jferprojects.chestrun',
  appName: 'Chest & Run',
  webDir: 'out',
  backgroundColor: '#09090b',
  plugins: {
    // Light status/navigation bar icons on the dark background.
    SystemBars: { style: 'DARK' },
  },
  android: {
    // Release builds can't load remote content or be inspected from desktop Chrome.
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
