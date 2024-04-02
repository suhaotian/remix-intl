import type { Cookie } from '@remix-run/node';
import i18next, {
  paramKey,
  mode,
  getLocales,
  getMessages,
  defaultNS,
  defaultLocale as _defaultLocale,
  // @ts-ignore
} from 'remix-intl/i18n';
// @ts-ignore
import { acceptLanguageMatcher, stringSimilarity } from 'remix-intl/utils';

export async function initIntl(
  request: Request,
  i18nCookie: Cookie
): Promise<{
  locale: string;
  dir: 'ltr' | 'rtl';
  isRedirect: boolean;
  redirectURL: string;
  locales: string[];
  messages: { [key: string]: unknown };
}> {
  const res = await parseLocale(request, i18nCookie);
  const { messages } = res.isRedirect ? { messages: {} } : await getMessages(res.locale);
  if (!res.isRedirect) {
    i18next.addResourceBundle(res.locale, defaultNS, messages);
  }
  return {
    ...res,
    messages,
  };
}

export async function parseLocale(
  request: Request,
  i18nCookie: Cookie
): Promise<{
  locale: string;
  dir: 'ltr' | 'rtl';
  isRedirect: boolean;
  redirectURL: string;
  locales: string[];
}> {
  const isSearchParamMode = mode === 'search';

  const { locales } = await getLocales();
  const defalutLocale = _defaultLocale || locales[0];

  const urlObj = new URL(request.url);
  const pathArr = isSearchParamMode ? [] : urlObj.pathname.split('/');
  const locale =
    (isSearchParamMode
      ? urlObj.searchParams.get(paramKey)?.toLowerCase()
      : pathArr[1].toLowerCase()) || '';
  let findedLocale = locales.find((item: string) => item.toLowerCase() === locale);
  let isRedirect = false;
  let redirectURL = '';
  if (!findedLocale) {
    const current = {
      percent: 0,
      locale: defalutLocale,
    };

    // detect cookie language
    const cookieHeader = request.headers.get('Cookie');
    let cookieLocale = await i18nCookie.parse(cookieHeader);
    if (cookieLocale && cookieLocale !== null) {
      const locale = cookieLocale?.toLowerCase?.();
      cookieLocale = locales.find((item: string) => item.toLowerCase() === locale) || '';
    }
    if (cookieLocale && cookieLocale !== null) {
      current.percent = 1;
      current.locale = cookieLocale;
    } else {
      // find similiarity
      locales.forEach((item: string) => {
        const percent = stringSimilarity(locale, item);
        if (percent > current.percent) {
          current.percent = percent;
          current.locale = item;
        }
      });
    }

    if (current.percent >= 0.75) {
      findedLocale = current.locale;
      if (!isSearchParamMode) {
        pathArr[1] = findedLocale;
      }
    } else {
      // detect header language
      const acceptLanguage = request.headers.get('accept-language');
      const matchedLocale = acceptLanguage
        ? acceptLanguageMatcher(acceptLanguage, locales, '')
        : '';
      if (matchedLocale) {
        current.percent = 1;
        current.locale = matchedLocale;
      }
    }

    if (!findedLocale) {
      findedLocale = defalutLocale;
      if (!isSearchParamMode) {
        pathArr.unshift('');
        pathArr[1] = defalutLocale;
      }
    }

    isRedirect = true;
    if (!isSearchParamMode) {
      redirectURL = pathArr.join('/') + urlObj.search + urlObj.hash;
    } else {
      urlObj.searchParams.set(paramKey, findedLocale);
      redirectURL = urlObj.toString();
    }
  }

  return {
    locale: findedLocale,
    dir: i18next.dir(findedLocale),
    isRedirect,
    redirectURL,
    locales,
  };
}
