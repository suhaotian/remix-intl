import type { i18n } from 'i18next';

/**
 * `segment` mode url example: http://example.com/en
 *
 * `search` mode url example: http://example.com/?lang=en
 */
export type Mode = 'segment' | 'search';

export interface GetLocalesRes {
  locales: string[];
}

export interface GetMessagesRes {
  messages: { [key: string]: unknown };
  locale: string;
  ns?: string;
}

export interface IntlConfig {
  mode: Mode;
  paramKey: string;
  cookieKey: string;
  defaultNS: string;
  clientKey: string;
  defaultLocale: string;
  getLocales(): Promise<GetLocalesRes>;
  getMessages(locale: string, ns?: string): Promise<GetMessagesRes>;
  i18next: i18n;
}

export default {};
