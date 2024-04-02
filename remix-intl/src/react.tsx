import { useLocation, useSearchParams } from '@remix-run/react';
import type { TOptions } from 'i18next';
import React from 'react';
// @ts-ignore
import i18next, { defaultNS, clientKey, mode, paramKey, defaultLocale } from 'remix-intl/i18n';

export function useLocale() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isSearchParamMode = mode === 'search';
  return (
    (isSearchParamMode ? searchParams.get(paramKey) : location.pathname.split('/')[1]) ||
    defaultLocale
  );
}

export const useTranslation = useT;
export function useT(namespace?: string) {
  const ns = namespace;
  const locale = useLocale();

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

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { locale, messages } = (window as any)[clientKey] || {};
  if (locale && messages) {
    i18next.addResourceBundle(locale, defaultNS, messages);
  }
  return children;
}

export function IntlScript() {
  const locale = useLocale();
  const i18nData = locale ? { messages: i18next.getResourceBundle(locale, defaultNS), locale } : {};
  const isClient = typeof document !== 'undefined';

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          window['${clientKey}'] = ${isClient ? JSON.stringify((window as any)[clientKey]) : JSON.stringify(i18nData)}
        `,
      }}
    />
  );
}
