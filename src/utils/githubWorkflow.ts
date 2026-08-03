export const GITHUB_WORKFLOW_YML = `# .github/workflows/android.yml
name: Build Android APK

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-android:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Node Dependencies
        run: npm ci || npm install

      - name: Build Web Assets
        run: npm run build

      - name: Setup Java JDK
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Add Capacitor Android Platform
        run: |
          npx cap add android || true
          npx cap sync android

      - name: Build APK via Gradle
        run: |
          cd android
          chmod +x gradlew
          ./gradlew assembleDebug --stacktrace

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: Android-Gesture-Controller-APK
          path: android/app/build/outputs/apk/debug/app-debug.apk
`;

export const CAPACITOR_CONFIG_TS = `import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gesture.controller.app',
  appName: 'GestureController',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      permissions: ["camera"]
    }
  }
};

export default config;
`;

export const APK_BUILD_INSTRUCTIONS_FA = [
  {
    step: 1,
    title: 'انتقال کد به گیت‌هاب (Export to GitHub)',
    desc: 'از منوی تنظیمات بالا سمت راست AI Studio، گزینه Export to GitHub را انتخاب کنید یا کدها را درون یک ریپازیتوری جدید گیت‌هاب Push کنید.'
  },
  {
    step: 2,
    title: 'تأیید فایل اکشن (GitHub Actions Workflow)',
    desc: 'فایل .github/workflows/android.yml به طور خودکار در پروژه قرار داده شده است. پس از Push، گیت‌هاب تب Actions را فعال خواهد کرد.'
  },
  {
    step: 3,
    title: 'ساخت اتوماتیک APK',
    desc: 'به تب Actions در ریپازیتوری گیت‌هاب بروید. اکشن Build Android APK به صورت خودکار اجرا می‌شود و فرآیند ساخت فایل APK گوشی را انجام می‌دهد.'
  },
  {
    step: 4,
    title: 'دانلود و نصب روی گوشی اندروید',
    desc: 'پس از اتمام ساخت (سبز شدن تیک اکشن)، در انتهای صفحه اکشن در بخش Artifacts، فایل Android-Gesture-Controller-APK را دانلود کرده و روی گوشی نصب کنید!'
  }
];
