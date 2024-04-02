import { Links, Meta, Outlet, Scripts, ScrollRestoration, json, redirect } from '@remix-run/react';

import { parseLocale } from 'remix-intl';
import { IntlScript } from 'remix-intl/react';
import { LoaderFunctionArgs } from '@remix-run/node';
import { i18nCookie } from './i18n.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const res = await parseLocale(request, i18nCookie);
  if (res.isRedirect) {
    return redirect(res.redirectURL);
  }
  return json(res, {
    headers: {
      'Set-Cookie': await i18nCookie.serialize(res.locale),
    },
  });
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
