<a href="https://pkg-size.dev/remix-intl"><img src="https://pkg-size.dev/badge/install/84979" title="Install size for remix-intl"></a> <a href="https://pkg-size.dev/remix-intl"><img src="https://pkg-size.dev/badge/bundle/1634" title="Bundle size for remix-intl"></a>

# remix-intl

The best internationalization(i18n) library for your Remix apps.

**Features:**

- 🥳 Powerful and fully under your control
- 🚀 Minimal size, less dependencies

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
    - [1. Create files](#1-create-files)
      - [Create i18n config file](#create-i18n-config-file)
      - [Create i18n cookie file](#create-i18n-cookie-file)
      - [Create i18n navigation components file](#create-i18n-navigation-components-file)
    - [2. Update](#2-update)
      - [Update server entry](#update-server-entry)
      - [Update client entry](#update-client-entry)
      - [Update `root.tsx`](#update-roottsx)
    - [Create i18n messages](#create-i18n-messages)
  - [Usage](#usage)
    - [Different mode: `segment` or `search`](#different-mode-segment-or-search)
    - [`paramKey`](#paramkey)
    - [Switch different languages](#switch-different-languages)
    - [`Link`, `NavLink` and `useNavigate`](#link-navlink-and-usenavigate)
    - [`useT` and `useLocale`](#uset-and-uselocale)
    - [`getT` and `getLocale` in `meta` / `loader` / `action`](#gett-and-getlocale-in-meta--loader--action)
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

### 1. Create files

#### Create i18n config file

`app/i18n.ts`

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

export const intlConfig: IntlConfig = {
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

`app/i18n.server.ts`

```ts
// app/i18n.server.ts
import { createCookie } from '@remix-run/node';
import { intlConfig } from './i18n';

export const i18nCookie = createCookie(intlConfig.cookieKey);
```

#### Create i18n navigation components file

`app/navigation.tsx`

```tsx
// app/navigation.tsx
import { createSharedPathnamesNavigation } from 'remix-intl/navigation';

const { Link, NavLink, useNavigate, SwitchLocaleLink } = createSharedPathnamesNavigation();

export { Link, NavLink, useNavigate, SwitchLocaleLink };
```

### 2. Update

#### Update server entry

`app/entry.server.tsx`: **3 changes**

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

/* --- 2.ADD `async` --- */
export default async function handleRequest(
  /* --- 2.ADD `async` end --- */
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  loadContext: AppLoadContext
) {
  /* --- 3.ADD THIS --- */
  await initIntl(request, i18nCookie);
  /* --- 3.ADD THIS END --- */

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

`app/entry.client.tsx`: **2 changes**

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

#### Update `root.tsx`

`app/root.tsx`: **4 changes**

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

`public/locales/en/index.json`

```json
{
  "hi": "Hello"
}
```

`public/locales/zh-CN/index.json`

```json
{
  "hi": "您好"
}
```

## Usage

### Different mode: `segment` or `search`

**segment mode:** `https://example.com/locale/path`

**search mode:** `https://example.com/path?lang=locale`

Default is `search` mode, you can update `mode` in `app/i18n.ts` config file.

> If you choose `segment` mode, don't forget add file prefix `($lang).` to your routes files

### `paramKey`

Default is `lang`, you can change to others you like.

### Switch different languages

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
      {langs.map((item, idx) => {
        return (
          <SwitchLocaleLink key={item.locale} locale={item.code} query={{ idx }}>
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

### `Link`, `NavLink` and `useNavigate`

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

### `useT` and `useLocale`

In React components, we can use `useLocale` to get current locale code,

and `useT` can get `t` function to translate:

```tsx
import { useLocale, useT } from 'remix-intl';

export default function RemixIntlExample() {
  const locale = useLocale();
  const { t, locale: sameWithLocale } = useT();
  // or const { t,  locale: sameWithLocale } = useT(namespace);

  return (
    <div>
      <h1>{t('i18n_key')}</h1>
      <p>current locale: {locale}</p>
    </div>
  );
}
```

### `getT` and `getLocale` in `meta` / `loader` / `action`

Out of react components, like inside `meta`, `loader` or `action`, we can use `getT` to get `t` function and translate:

```tsx
import { getLocale, getT } from 'remix-intl/server';

// in `meta`
export const meta: MetaFunction = ({ location }) => {
  const { t, locale } = getT(location); // `getT` can receive location object or string pathname?search
  // or const { t, locale } = getT(location, namespace);
  const sameWithLocale = getLocale(location); // `getLocale` same paramater with `getT`

  return [{ title: t('i18n_key') }];
};

// in `loader`

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { t } = getT(request.url);
  const locale = getLocale(request.url);
  return json({ title: t('i18n_key'), locale });
};

// in `action`
export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();
  const { t } = getT(request.url);
  if (!body.get('title')) {
    return json({ errors: { title: t('required') } });
  }
  return redirect(request.url);
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

More `i18next` API: https://www.i18next.com/

## Website and example

👉 [https://remix-intl.tsdk.dev](https://remix-intl.tsdk.dev) (WIP 🙇🏻‍♂️)

## Support

- Any questions, feel free create issues 🙌
