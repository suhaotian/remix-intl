# remix-intl

The best internationalization(i18n) library for your Remix apps.

**Features:**

- 🥳 Powerful and fully under your control
- 🚀 Minimal size, less dependencies
- [ ] Unit tests and E2E tests

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

## Table of Contents

- [remix-intl](#remix-intl)
  - [What does it look like?](#what-does-it-look-like)
  - [Table of Contents](#table-of-contents)
  - [Installing](#installing)
  - [Configuration](#configuration)
    - [Create files](#create-files)
      - [Create i18n config file](#create-i18n-config-file)
      - [Create i18n cookie file](#create-i18n-cookie-file)
      - [Create i18n navigation components](#create-i18n-navigation-components)
    - [Update](#update)
      - [Update server entry](#update-server-entry)
      - [Update client entry](#update-client-entry)
      - [Update root](#update-root)
    - [Create i18n messages](#create-i18n-messages)
      - [**public/locales/en/index.json**](#publiclocalesenindexjson)
      - [**public/locales/zh-CN/index.json**](#publiclocaleszh-cnindexjson)
    - [Usage](#usage)
      - [Different mode: `segment` and `search`](#different-mode-segment-and-search)
      - [`paramKey`](#paramkey)
      - [Switch language](#switch-language)
      - [`Link`, `NavLink` and `useNavigate`](#link-navlink-and-usenavigate)
  - [API](#api)
    - [remix-intl API](#remix-intl-api)
    - [i18next API](#i18next-api)
  - [Website and example](#website-and-example)
  - [Support](#support)

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

### Create files

#### Create i18n config file

**app/i18n.ts**

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

async function getLocales(): Promise<GetLocalesRes> {
  // you can fetch dynamic locales from others API
  return { locales: ['zh-CN', 'en'] };
}

async function getMessages(locale: string, ns?: string): Promise<GetMessagesRes> {
  // you can fetch dynamic messages from others API
  const messages = await fetch(
    `http://localhost:5173/locales/${locale}/${ns || 'index'}.json`
  ).then((res) => res.json());
  return { messages, locale, ns };
}

const intlConfig: IntlConfig = {
  mode: 'search',
  paramKey: 'lang',
  cookieKey: 'remix_intl',
  defaultNS,
  clientKey: 'remix_intl',
  defaultLocale: '',
  getLocales,
  getMessages,
  i18next,
};

setIntlConfig(intlConfig);

export default i18next;
```

#### Create i18n cookie file

**app/i18n.server.ts**

```ts
// app/i18n.server.ts
import { createCookie } from '@remix-run/node';
import { intlConfig } from './i18n';

export const i18nCookie = createCookie(intlConfig.cookieKey, {
  path: '/',
  sameSite: 'lax',
  httpOnly: true,
  secrets: [],
});
```

#### Create i18n navigation components

**app/navigation.tsx**

```tsx
// app/navigation.tsx
import { createSharedPathnamesNavigation } from 'remix-intl/navigation';

const { Link, NavLink, useNavigate, SwitchLocaleLink } = createSharedPathnamesNavigation();

export { Link, NavLink, useNavigate, SwitchLocaleLink };
```

### Update

#### Update server entry

`app/entry.server.tsx`: **2 parts** change

```tsx
// app/entry.server.tsx
import { PassThrough } from 'node:stream';

import type { AppLoadContext, EntryContext } from '@remix-run/node';
import { createReadableStreamFromReadable } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderToPipeableStream } from 'react-dom/server';

/* --- 1.IMPORT THIS --- */
import { initIntl } from 'remix-intl/server';
import { i18nCookie } from './i18n.server';
/* --- 1.IMPORT THIS END --- */

const ABORT_DELAY = 5_000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  loadContext: AppLoadContext
) {
  /* --- 2.ADD THIS --- */
  await initIntl(request, i18nCookie);
  /* --- 2.ADD THIS END --- */

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

#### Update client entry

`app/entry.client.tsx`: **2 parts** change

```tsx
// app/entry.client.tsx
import { RemixBrowser } from '@remix-run/react';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

/* --- 1.IMPORT THIS --- */
import { ClientProvider as IntlProvider } from 'remix-intl';
/* --- 1.IMPORT THIS END --- */

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      {/* --- 2.ADD THIS --- */}
      <IntlProvider>
        <RemixBrowser />
      </IntlProvider>
      {/* --- 2.ADD THIS END--- */}
    </StrictMode>
  );
});
```

#### Update root

`app/root.tsx`: **4 parts** change

```tsx
// app/root.tsx

/* --- 1.IMPORT THIS --- */
import './i18n';
import { parseLocale } from 'remix-intl/server';
import { IntlScript } from 'remix-intl';
import { i18nCookie } from './i18n.server';
/* --- 1.IMPORT THIS END --- */

import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  json,
  redirect,
} from '@remix-run/react';
import { LoaderFunctionArgs } from '@remix-run/node';

export async function loader({ request }: LoaderFunctionArgs) {
  /* --- 2.ADD THIS --- */
  const res = await parseLocale(request, i18nCookie);
  if (res.isRedirect) {
    return redirect(res.redirectURL);
  }
  return json(res, {
    headers: {
      'Set-Cookie': await i18nCookie.serialize(res.locale),
    },
  });
  /* --- 2.ADD THIS END --- */
}

export function Layout({ children }: { children: React.ReactNode }) {
  /* --- 3.ADD THIS --- */
  const { locale, dir } = useLoaderData<typeof loader>();
  return (
    <html lang={locale} dir={dir}>
      {/* --- 3.ADD THIS END --- */}
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
        {/* --- 4.ADD THIS --- */}
        <IntlScript />
        {/* --- 4.ADD THIS END --- */}
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
```

### Create i18n messages

#### **public/locales/en/index.json**

```json
{
  "hi": "Hello"
}
```

#### **public/locales/zh-CN/index.json**

```json
{
  "hi": "您好"
}
```

### Usage

#### Different mode: `segment` and `search`

**segment mode:** `https://example.com/locale/path`

**search mode:** `https://example.com/path?lang=locale`

Default is `search` mode, you can update `mode` in `app/i18n.ts` config file.

#### `paramKey`

Default is `lang`, you can change to others.

#### Switch language

No need refresh page example:

```tsx
import { SwitchLocaleLink } from '~/navigation';

const langs = [
  {
    text: 'English',
    code: 'en',
  },
  {
    text: '简体中文',
    code: 'zh-CN',
  },
];

export default function LanguageSwitcher() {
  return (
    <div>
      {langs.map((item) => {
        return (
          <SwitchLocaleLink key={item.locale} locale={item.code}>
            {item.text}
          </SwitchLocaleLink>
        );
      })}
    </div>
  );
}
```

Refresh page example:

```tsx
import { SwitchLocaleLink } from '~/navigation';

const langs = [
  {
    text: 'English',
    code: 'en',
  },
  {
    text: '简体中文',
    code: 'zh-CN',
  },
];

export default function LanguageSwitcher() {
  return (
    <div>
      {langs.map((item) => {
        return (
          <SwitchLocaleLink reloadDocument key={item.locale} locale={item.code}>
            {item.text}
          </SwitchLocaleLink>
        );
      })}
    </div>
  );
}
```

#### `Link`, `NavLink` and `useNavigate`

```tsx
import { Link, NavLink, useNavigate } from '~/navigation';

export default function LinkNavigate() {
  const navigate = useNavigate();
  return (
    <div>
      {/* /docs?lang=[locale] */}
      <Link to="/docs">Documents</Link>
      {/* /docs?lang=[locale] */}
      <NavLink to="/docs">Documents</NavLink>
      <button
        onClick={() => {
          /* /docs?lang=[locale] */
          navigate('/docs');
        }}>
        Go to Documents
      </button>
    </div>
  );
}
```

## API

#### remix-intl API

```tsx
// hooks
import { useT, useLocale } from 'remix-intl';

// components
import { ClientProvider, IntlScript } from 'remix-intl';
import {
  Link, NavLink, SwitchLocaleLink, useNavigate
} from from '~/navigation'

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

## Website and example

👉 [https://remix-intl.tsdk.dev](https://remix-intl.tsdk.dev)

## Support

- Any questions, feel free create issues 🙌
