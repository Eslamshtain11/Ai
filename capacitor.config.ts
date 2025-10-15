import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.personalaccountant',
  appName: 'personal-accountant',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // قم بإزالة هذا الحقل عند تجهيز نسخة الإنتاج.
    url: 'http://localhost:5173',
    cleartext: true
  }
};

export default config;
