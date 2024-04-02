import { createCookie } from '@remix-run/node';
import { cookieKey } from 'remix-intl/i18n';

export const i18nCookie = createCookie(cookieKey, {
  path: '/',
  sameSite: 'lax',
  httpOnly: true,
  secrets: [],
});
