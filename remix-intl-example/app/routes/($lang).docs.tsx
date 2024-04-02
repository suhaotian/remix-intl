import { json, LoaderFunctionArgs, type MetaFunction } from '@remix-run/node';
import { useT } from 'remix-intl';
import { parseLocale, getT } from 'remix-intl/server';
import { getIntlConfig } from 'remix-intl/i18n';
import { i18nCookie } from '~/i18n.server';

import { SwitchLocaleLink } from '~/navigation';
import { useLoaderData } from '@remix-run/react';

const NAMESPACE = 'docs';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { locale, locales } = await parseLocale(request, i18nCookie);
  const { messages } = await getIntlConfig().getMessages(locale, NAMESPACE);
  return json({ messages, locale, NAMESPACE, locales });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [];
  getIntlConfig().i18next.addResourceBundle(data.locale, NAMESPACE, data.messages);
  const { t } = getT(data.locale, NAMESPACE);

  return [{ title: t('doc') }, { name: 'description', content: 'Welcome to Remix!' }];
};

export default function Index() {
  const { locales } = useLoaderData<typeof loader>();

  const { t } = useT(NAMESPACE);

  return (
    <div>
      <h1>{t('doc')}</h1>
      <ul>
        {locales.map((item) => {
          return (
            <li key={item}>
              <SwitchLocaleLink locale={item} reloadDocument>
                {item}
              </SwitchLocaleLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
