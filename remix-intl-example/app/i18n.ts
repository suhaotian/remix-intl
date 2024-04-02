import type { GetLocalesRes, GetMessagesRes, Mode } from 'remix-intl/types';
import { i18n, createInstance } from 'i18next';
import { http } from './http';

export const mode: Mode = 'search';
export const paramKey = 'lang';
export const cookieKey = 'remix_intl';
export const defaultNS = 'remix_intl';
export const clientKey = 'remix_intl';
export const defaultLocale = '';

export async function getLocales(): Promise<GetLocalesRes> {
  const { data } = await http.get(`/locales.json`, { threshold: 10 * 1000 });
  return { locales: data };
}

export async function getMessages(locale: string, ns?: string): Promise<GetMessagesRes> {
  const { data } = await http.get(`/locales/${locale}/${ns || 'index'}.json`, {
    threshold: 10 * 1000,
  });
  return { messages: data, locale, ns };
}

const i18next = createInstance({ defaultNS, ns: [defaultNS], resources: {} });

i18next.init({
  defaultNS,
  ns: [defaultNS],
  resources: {},
});

export default i18next as i18n;
