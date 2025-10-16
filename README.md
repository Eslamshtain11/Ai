# المحاسب الشخصي للمعلم الخصوصي

تطبيق ويب وAndroid (عبر Capacitor) لإدارة دخل ومصروفات وطلاب المعلم الخصوصي، مبني باستخدام Vite + React، TailwindCSS، وSupabase.

## المتطلبات الأولية

1. **تهيئة المشروع**
   ```bash
   npm install
   ```
2. **إنشاء ملف البيئة** `.env` ثم تعبئة القيم الفعلية:
   ```bash
   VITE_SUPABASE_URL=YOUR_URL
   VITE_SUPABASE_ANON_KEY=YOUR_ANON
   ```
3. **تهيئة قاعدة البيانات** في لوحة Supabase (SQL Editor) بنسخ وتشغيل سكربت الجداول والسياسات وRPC كما هو مرفق في المواصفات.

## التشغيل محليًا

```bash
npm run dev
```

سيعمل التطبيق على `http://localhost:5173` بوضع RTL ونمط داكن وخط **Cairo**.

## البناء للإنتاج

```bash
npm run build
```

الملفات الجاهزة للنشر تُنتج داخل مجلد `dist` ويمكن رفعها إلى Netlify أو Vercel (Framework: Vite، Output: dist).

## تجهيز تطبيق Android عبر Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init personal-accountant com.eslam.personalaccountant
npx cap add android
npm run build
npx cap copy
npx cap open android
```

يمكن بعد ذلك توليد APK من Android Studio.

## الملخص الوظيفي

- مصادقة بريد إلكتروني/كلمة مرور مع إنشاء ملف تعريف تلقائي عبر `ensure_profile`.
- صفحات محمية: لوحة تحكم، الطلاب، الدفعات، المصروفات، التحليلات، الإعدادات.
- إدارة طلاب كاملة مع مجموعات، بحث فوري، DatePicker RTL بثلاث قوائم، ورسوم شهرية بالجنيه المصري.
- جداول دفعات ومصروفات مع CRUD كامل، تصدير XLSX/PDF، وصف إجمالي باللون الذهبي، واعتماد العملة المصرية.
- تحليلات رسومية (Bar + Pie) باستخدام Recharts لعرض الدخل الشهري وتوزيع المجموعات.
- إعدادات تذكير بالدفعات قبل/بعد الموعد مع حفظ مباشر في جدول `settings`.
- تجربة عربية داكنة بالكامل باستخدام الألوان المطلوبة وخط Cairo.
