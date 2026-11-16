import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.donkeysisle.laventuredenael',
  appName: "L'aventure de Nael",
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
