import { createInstance } from 'i18next';
import type { GetLocalesRes, GetMessagesRes, IntlConfig } from 'remix-intl/types';
import { setIntlConfig } from 'remix-intl/i18n';
import { http } from './http';

const defaultNS = 'remix_intl';
const i18next = createInstance({ defaultNS, ns: [defaultNS], resources: {} });
i18next.init({
  defaultNS,
  ns: [defaultNS],
  resources: {},
});

export const intlConfig: IntlConfig = {
  mode: 'search',
  paramKey: 'lang',
  cookieKey: 'remix_intl',
  defaultNS,
  clientKey: 'remix_intl',
  defaultLocale: '',
  async getLocales(): Promise<GetLocalesRes> {
    const { data } = await http.get(`/locales.json`, { threshold: 10 * 1000 });
    return { locales: data };
  },
  async getMessages(locale: string, ns?: string): Promise<GetMessagesRes> {
    const { data } = await http.get(`/locales/${locale}/${ns || 'index'}.json`, {
      threshold: 10 * 1000,
    });
    return { messages: data, locale, ns };
  },
  i18next,
};

setIntlConfig(intlConfig);
