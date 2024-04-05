import type { Cookie } from '@remix-run/node';
import type { Location } from '@remix-run/react';
import type { TOptions, i18n } from 'i18next';
// @ts-ignore
import { getIntlConfig } from 'remix-intl/i18n';
// @ts-ignore
import { acceptLanguageMatcher, stringSimilarity } from 'remix-intl/utils';

export function getLocale(
  locationOrHref: (Partial<Location> & Pick<Location, 'pathname' | 'search'>) | string
) {
  const { mode, paramKey, defaultLocale } = getIntlConfig();
  const isSearchMode = mode === 'search';
  if (isSearchMode) {
    const hrefPath =
      typeof locationOrHref === 'string'
        ? locationOrHref
        : locationOrHref.pathname + locationOrHref.search;
    const urlObj = new URL(hrefPath.startsWith('http') ? hrefPath : 'http://localhost' + hrefPath);
    const locale = urlObj.searchParams.get(paramKey) || defaultLocale;
    return locale;
  }

  const locale =
    typeof locationOrHref === 'string'
      ? getLocaleFromPathname(locationOrHref)
      : getLocaleFromPathname(locationOrHref.pathname);

  return locale;
}

export function getT(
  locationOrHref: (Partial<Location> & Pick<Location, 'pathname' | 'search'>) | string,
  namespace?: string
) {
  const { i18next } = getIntlConfig();
  const ns = namespace;
  const locale = getLocale(locationOrHref);

  return {
    locale,
    t(...args: Parameters<i18n['t']>) {
      if (typeof args[args.length - 1] === 'object') {
        (args[args.length - 1] as TOptions).lng = locale;
        if (ns) {
          (args[args.length - 1] as TOptions).ns = ns;
        }
      } else {
        args.push({ lng: locale, ns } as any);
      }
      return i18next.t(...args) as string;
    },
  };
}

function getLocaleFromPathname(pathname: string) {
  pathname = pathname.startsWith('http') ? new URL(pathname).pathname : pathname;
  const result = pathname.split('/');
  return result[1] || result[0];
}

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
  const { defaultNS, i18next, getMessages } = getIntlConfig();
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
  const { mode, paramKey, i18next, getLocales, defaultLocale: _defaultLocale } = getIntlConfig();
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
    } else if (locale) {
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
        findedLocale = matchedLocale;
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
