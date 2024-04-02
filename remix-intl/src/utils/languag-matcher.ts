export function acceptLanguageMatcher(
  acceptLanguage: string,
  locales: string[],
  defaultLocaleWhenNotMatch: string
) {
  const supportLocales = transformAcceptLanguageToSortedArray(acceptLanguage);
  if (supportLocales.length > 0) {
    const locale = locales.find((locale) => {
      const l = locale.toLowerCase();
      return supportLocales.find((item) => {
        const i = item.toLowerCase();
        return i === l;
      });
    });
    if (locale) return locale;
  }
  return defaultLocaleWhenNotMatch;
}

export function transformAcceptLanguageToSortedArray(acceptLanguage: string): string[] {
  const result: string[] = [];
  acceptLanguage.split(';').forEach((item) => {
    item.split(',').forEach((i) => {
      const locale = i.trim();
      if (locale && !locale.startsWith('q=')) {
        result.push(locale);
        const arr = locale.split('-');
        if (arr.length > 1) {
          result.push(arr[0]);
        }
      }
    });
  });
  return result;
}
