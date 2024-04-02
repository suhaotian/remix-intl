import { useLocation, useSearchParams } from '@remix-run/react';
import type { TOptions, i18n } from 'i18next';
import React from 'react';
// @ts-ignore
import { getIntlConfig } from 'remix-intl/i18n';

export function useLocale() {
  const { mode, paramKey, defaultLocale } = getIntlConfig();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isSearchParamMode = mode === 'search';
  return (
    (isSearchParamMode ? searchParams.get(paramKey) : location.pathname.split('/')[1]) ||
    defaultLocale
  );
}

export function useT(namespace?: string) {
  const { i18next } = getIntlConfig();

  const ns = namespace;
  const locale = useLocale();

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

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { clientKey, defaultNS, i18next } = getIntlConfig();
  const { locale, messages } = (window as any)[clientKey] || {};
  if (locale && messages) {
    i18next.addResourceBundle(locale, defaultNS, messages);
  }
  return children;
}

export function IntlScript() {
  const { clientKey, defaultNS, i18next } = getIntlConfig();

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
