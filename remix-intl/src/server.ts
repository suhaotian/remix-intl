import type { Location } from '@remix-run/react';
import type { TOptions } from 'i18next';
import i18next, {
  paramKey,
  mode,
  defaultLocale,
  // @ts-ignore
} from 'remix-intl/i18n';

export function getLocale(
  locationOrHref: (Partial<Location> & Pick<Location, 'pathname' | 'search'>) | string
) {
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

export const getTranslation = getT;
export function getT(
  locationOrHref: (Partial<Location> & Pick<Location, 'pathname' | 'search'>) | string,
  namespace?: string
) {
  const ns = namespace;
  const locale = getLocale(locationOrHref);

  return {
    locale,
    t(...args: Parameters<typeof i18next.t>) {
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
