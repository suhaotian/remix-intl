import { createInstance } from 'i18next';
// @ts-ignore
import type { GetLocalesRes, GetMessagesRes, IntlConfig } from 'remix-intl/types';

const defaultNS = 'remix_intl';

const i18next = createInstance({ defaultNS, ns: [defaultNS], resources: {} });
i18next.init({
  defaultNS,
  ns: [defaultNS],
  resources: {},
});

const config: IntlConfig = {
  mode: 'search',
  paramKey: 'lang',
  cookieKey: 'remix_intl',
  defaultNS: 'remix_intl',
  clientKey: 'remix_intl',
  defaultLocale: '',
  async getLocales(): Promise<GetLocalesRes> {
    return { locales: [] };
  },
  async getMessages(locale: string, ns?: string): Promise<GetMessagesRes> {
    return { messages: {}, locale, ns };
  },
  i18next,
};

export function setIntlConfig(
  _config: Partial<IntlConfig> & Pick<IntlConfig, 'getLocales' | 'getMessages' | 'i18next'>
) {
  Object.assign(config, _config);
}

export function getIntlConfig() {
  return config;
}
