# 🌐 Internationalization (i18n) Guide

This directory contains translation files for the application. The system supports automatic language detection and fallback to English.

## 📂 Directory Structure

```
locales/
├── en/           # English (default)
├── es/           # Spanish
├── ar/           # Arabic
├── ru/           # Russian  
├── zh/           # Chinese
├── fr/           # French
├── de/           # German
└── [language]/   # Additional languages
```

## 🚀 Adding a New Language

1. **Create language directory**: Create a new folder with the ISO 639-1 language code (e.g., `it` for Italian)

2. **Copy translation file**: Copy `en/translation.json` to your new language folder and translate all values

3. **Update language list**: Add your language to `SUPPORTED_LANGUAGES` in `src/app/i18n.ts`:

```typescript
{ code: 'it', name: 'Italiano', flag: '🇮🇹' }
```

## 📝 Translation File Format

Each `translation.json` file contains nested objects with translation keys:

```json
{
  "common": {
    "loading": "Loading...",
    "save": "Save"
  },
  "login": {
    "title": "Customer Service Bot"
  }
}
```

## 🎯 Usage in Components

Use the `useTranslation` hook to access translations:

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return <h1>{t('login.title')}</h1>;
}
```

## 🔧 Features

- **Automatic Detection**: Detects browser language automatically
- **Persistence**: Saves language preference in localStorage
- **Fallback**: Falls back to English if translation is missing
- **Error Handling**: Graceful handling of missing language files
- **Real-time Switching**: Change language without page reload

## 🌍 Currently Supported Languages

- 🇺🇸 English (en) - Default
- 🇪🇸 Spanish (es) - Complete
- 🇸🇦 Arabic (ar) - Partial
- 🇷🇺 Russian (ru) - Partial
- 🇨🇳 Chinese (zh) - Partial
- 🇫🇷 French (fr) - Complete
- 🇩🇪 German (de) - Complete

## ⚠️ Important Notes

1. **Always keep English complete** - it's the fallback language
2. **Use consistent key structure** across all languages
3. **Include HTML entities** for special characters if needed
4. **Test language switching** after adding new languages
5. **Follow the same nesting structure** as the English file

## 🛠️ Development Tips

- Use interpolation for dynamic content: `"welcome": "Welcome {{name}}!"`
- Use pluralization for count-based text: `"item": "{{count}} item", "item_plural": "{{count}} items"`
- Keep keys descriptive and organized by feature/component
- Use short, clear keys that describe the content purpose

## 🔍 Debugging

To debug translation issues:

1. Check browser console for i18n logs
2. Verify file exists at `/locales/[lang]/translation.json`
3. Ensure JSON syntax is valid
4. Check that language code is added to `SUPPORTED_LANGUAGES`

For more information, see the i18next documentation: https://www.i18next.com/