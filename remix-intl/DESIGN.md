# remix-intl

Best i18n lib for remix.js(^v2).

Goal:

- Less API
- Full tested

**API:**

- [x] plugin init(i18nAbsolutePath, viteConfig)
- [x] import getConfig from 'remix-intl/config'
- [x] createSharedPathnamesNavigation in navigation.tsx
- [x] getLocales
- [x] getMessages
- [x] init or redirect in root.tsx(server provider)
- [x] cookie cache: get locale in cookie
- [x] set i18n resource in server(init.ts)
- [x] set i18n resource in client(entry.client.tsx)
- [x] client provider
- ~~[ ] server provider~~ Use loader in root.tsx
- [x] async getT(namespace?: string)
- [x] useT(namespace?: string)
- [x] init improve: move getI18n to entry.server.tsx, paseLocale, useLocale
- [x] improve performance: cache and throttle
- [x] cookie cache: save locale in cookie
- [x] support search params (current use segment)
- [x] load part messages / namespace support(current: defalut namespace) (solution: get others i18n data on page's loader, and add resouce bundle to namespace, then useT(namespace) to translate)
- [x] switch locale: refresh
- [x] switch locale: no need refresh
- [x] ux improve: no need reload page to change locale(solution: fetch i18n data, add resource bundle, and set locale, finally update url)
- [ ] e2e tests: segment mode / query mode(search params mode) / Parallel testing
- [ ] unit tests
- [ ] website(also the example) and docs
- [x] README
- [ ] timezone/currency/format
- [ ] default locale no need redirect option

Install:

```sh
npm i remix-intl i18next

# or
pnpm i remix-intl i18next
```

### Setup

- ~~./vite.config.ts initPlugin~~
- ./app/entry.server.tsx initIntl
- ./app/entry.client.tsx ClientProvider
- ./app/i18n.tsx create config i18n.ts
- ./public/locales/\*.json create i18n messages files
- ./app/navigation.tsx create Link
- ./app/root.tsx update root to use parseLocale and add IntlScript

API

- useT
- useLocale
- getT
- getLocale
- Link / NavLink / SwitchLocaleLink / useNavigate
- initIntl
- IntlScript / ClientIntlProvider

Advance:

- Dynamic load bundle
- Use i18n-ally vscode plugin get better DX
