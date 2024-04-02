# remix-intl

**Don't use this lib yet, Still WIP!!!**

The best internationalization(i18n) library for your Remix apps.

**Features:**

- 🥳 Powerful and fully under your control
- 🚀 Minimal size, less dependencies
- [ ] E2E tests

- [remix-intl](#remix-intl)
  - [What does it look like?](#what-does-it-look-like)
  - [Installing](#installing)
  - [Configuration](#configuration)
    - [Create **public/locales/en/index.json**](#create-publiclocalesenindexjson)
    - [Create **app/i18n.ts**](#create-appi18nts)
    - [Create **app/i18n.server.ts**](#create-appi18nserverts)
    - [Update **vite.config.ts**:](#update-viteconfigts)
    - [Update **app/entry.server.tsx**](#update-appentryservertsx)
    - [Update **app/entry.client.tsx**](#update-appentryclienttsx)
    - [Update **app/root.tsx**](#update-approottsx)
    - [Create **app/navigation.tsx**](#create-appnavigationtsx)
    - [Website and example 👉 https://remix-intl.tsdk.dev](#website-and-example--httpsremix-intltsdkdev)

## What does it look like?

```tsx
// app/._index.tsx
import { ActionFunctionArgs, json, type MetaFunction } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { useT } from 'remix-intl';
import { getT } from 'remix-intl/server';

export const meta: MetaFunction = ({ location }) => {
  const { t } = getT(location);
  return [{ title: t('title') }];
};

export default function Index() {
  const { locales } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { t } = useT();

  return (
    <div>
      <h1>{t('create_todo')}</h1>
      <Form method="post">
        <input type="text" name="title" />

        {actionData?.errors?.title ? <em>{actionData?.errors.title}</em> : null}

        <button type="submit">{t('create_todo')}</button>
      </Form>
    </div>
  );
}

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();
  const { t } = getT(request.url);
  if (!body.get('title')) {
    return json({ errors: { title: t('required') } });
  }
}
```

> public/locales/en/index.json

```json
{
  "title": "Remix App",
  "hi": "Hello",
  "required": "Required",
  "create_todo": "Create Todo"
}
```

## Installing

```sh
# npm
npm install remix-intl i18next

# pnpm
pnpm add remix-intl i18next

# yarn
yarn add remix-intl i18next
```

## Configuration

### Create **public/locales/en/index.json**

```json
{
  "hi": "Hello"
}
```

### Create **public/locales/zh-CN/index.json**

```json
{
  "hi": "您好"
}
```

### Create **app/i18n.ts**

```ts
// app/i18n.ts
import { createInstance } from 'i18next';
import type { GetLocalesRes, GetMessagesRes, IntlConfig } from 'remix-intl/types';
import { setIntlConfig } from 'remix-intl/i18n';

const defaultNS = 'remix_intl';
const i18next = createInstance({ defaultNS, ns: [defaultNS], resources: {} });
i18next.init({
  defaultNS,
  ns: [defaultNS],
  resources: {},
});

const intlConfig: IntlConfig = {
  mode: 'search',
  paramKey: 'lang',
  cookieKey: 'remix_intl',
  defaultNS,
  clientKey: 'remix_intl',
  defaultLocale: '',
  async getLocales(): Promise<GetLocalesRes> {
    return { locales: ['zh-CN', 'en'] };
  },
  async getMessages(locale: string, ns?: string): Promise<GetMessagesRes> {
    const messages = await fetch(
      `http://localhost:5173/locales/${locale}/${ns || 'index'}.json`
    ).then((res) => res.json());
    return { messages, locale, ns };
  },
  i18next,
};

setIntlConfig(intlConfig);

export default i18next;
```

### Create **app/i18n.server.ts**

```ts
//app/i18n.server.ts
import { createCookie } from '@remix-run/node';
import { intlConfig } from './i18n';

export const i18nCookie = createCookie(intlConfig.cookieKey, {
  path: '/',
  sameSite: 'lax',
  httpOnly: true,
  secrets: [],
});
```

### Update **app/entry.server.tsx**

```tsx
// app/entry.server.tsx
import { PassThrough } from 'node:stream';

import type { AppLoadContext, EntryContext } from '@remix-run/node';
import { createReadableStreamFromReadable } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderToPipeableStream } from 'react-dom/server';
import { initIntl } from 'remix-intl/server';
import { i18nCookie } from './i18n.server';

const ABORT_DELAY = 5_000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  // This is ignored so we can keep it in the template for visibility.  Feel
  // free to delete this parameter in your app if you're not using it!
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loadContext: AppLoadContext
) {
  await initIntl(request, i18nCookie);
  return isbot(request.headers.get('user-agent') || '')
    ? handleBotRequest(request, responseStatusCode, responseHeaders, remixContext)
    : handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext);
}

function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} abortDelay={ABORT_DELAY} />,
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set('Content-Type', 'text/html');

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}

function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} abortDelay={ABORT_DELAY} />,
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set('Content-Type', 'text/html');

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
```

### Update **app/entry.client.tsx**

```tsx
// app/entry.client.tsx
import { RemixBrowser } from '@remix-run/react';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { ClientProvider as IntlProvider } from 'remix-intl';

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <IntlProvider>
        <RemixBrowser />
      </IntlProvider>
    </StrictMode>
  );
});
```

### Update **app/root.tsx**

```tsx
// app/root.tsx
import './i18n';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, json, redirect } from '@remix-run/react';
import { LoaderFunctionArgs } from '@remix-run/node';
import { parseLocale } from 'remix-intl/server';
import { IntlScript } from 'remix-intl';
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
```

### Create **app/navigation.tsx**

```tsx
// app/navigation.tsx
import { createSharedPathnamesNavigation } from 'remix-intl/navigation';

const { Link, NavLink, useNavigate, SwitchLocaleLink } = createSharedPathnamesNavigation();

export { Link, NavLink, useNavigate, SwitchLocaleLink };
```

### Website and example 👉 [https://remix-intl.tsdk.dev](https://remix-intl.tsdk.dev)

### API

#### remix-intl API

```tsx
// hooks
import { useT, useLocale } from 'remix-intl';

// components
import { ClientProvider, IntlScript } from 'remix-intl';

// api for server
import { getT, getLocale } from 'remix-intl/server';

// utils
import { isClient, stringSimilarity, acceptLanguageMatcher } from 'remix-intl/utils';
```

#### i18next API

```ts
import { getIntlConfig } from 'remix-intl/i18n';

getIntlConfig().i18next.addResouceBundle;
getIntlConfig().i18next.dir;
getIntlConfig().i18next.getResouceBundle;
```

More API: https://www.i18next.com/
