import { setupIntlConfig } from './i18n';
import { parseLocale } from 'remix-intl/server';
import { IntlScript } from 'remix-intl';
import { i18nCookie } from './i18n.server';

import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  json,
  redirect,
  useLoaderData,
} from '@remix-run/react';

import { LoaderFunctionArgs } from '@remix-run/node';

setupIntlConfig();

export async function loader({ request }: LoaderFunctionArgs) {
  const res = await parseLocale(request, i18nCookie);
  if (res.isRedirect && res.locale) {
    return redirect(res.redirectURL);
  }
  return json(res, {
    headers: {
      'Set-Cookie': await i18nCookie.serialize(res.locale),
    },
  });
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { locale, dir } = useLoaderData<typeof loader>();
  return (
    <html lang={locale} dir={dir}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <IntlScript />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
