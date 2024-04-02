import { i18n, createInstance } from 'i18next';
// @ts-ignore
import type { GetLocalesRes, GetMessagesRes, Mode } from 'remix-intl/types';

// if error means resolve alias not work

export const mode: Mode = 'search';
export const paramKey = 'lang';
export const cookieKey = 'remix_intl';
export const defaultNS = 'remix_intl';
export const clientKey = 'remix_intl';
export const defaultLocale = '';

export async function getLocales(): Promise<GetLocalesRes> {
  return { locales: [] };
}

export async function getMessages(locale: string, ns?: string): Promise<GetMessagesRes> {
  return { messages: {}, locale, ns };
}

const i18next = createInstance({ defaultNS, ns: [defaultNS], resources: {} });

i18next.init({
  defaultNS,
  ns: [defaultNS],
  resources: {},
});

export default i18next as i18n;

console.log(new Error("shouldn't call here"));

console.log(233);
