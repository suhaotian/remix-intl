import { createCookie } from '@remix-run/node';
import { intlConfig } from './i18n';

export const i18nCookie = createCookie(intlConfig.cookieKey, {
  path: '/',
  sameSite: 'lax',
  httpOnly: true,
  secrets: [],
});
