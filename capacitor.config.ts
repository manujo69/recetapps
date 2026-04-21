import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.recetapps.app',
  appName: 'RecetApps',
  webDir: 'dist/recetapps/browser',
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false,
      androidBiometric: {
        biometricAuth: false,
      },
    },
  },
};

export default config;
