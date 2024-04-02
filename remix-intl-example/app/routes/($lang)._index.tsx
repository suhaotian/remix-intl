import { ActionFunctionArgs, json, redirect, type MetaFunction } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { getIntlConfig } from 'remix-intl/i18n';
import { useT } from 'remix-intl';
import { getT } from 'remix-intl/server';
import { Link, SwitchLocaleLink, useNavigate } from '~/navigation';

export const loader = async () => {
  const { locales } = await getIntlConfig().getLocales();
  return json({ locales });
};

export const meta: MetaFunction = ({ location }) => {
  const { t } = getT(location);
  return [
    { title: t('hi') + ', New Remix App' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};

export default function Index() {
  const { locales } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { t } = useT();
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.8' }}>
      <h1>{t('hi')} Welcome to Remix</h1>
      <ul>
        <li>
          <a target="_blank" href="https://remix.run/tutorials/blog" rel="noreferrer">
            15m Quickstart Blog Tutorial
          </a>
        </li>
        <li>
          <a target="_blank" href="https://remix.run/tutorials/jokes" rel="noreferrer">
            Deep Dive Jokes App Tutorial
          </a>
        </li>
        <li>
          <a target="_blank" href="https://remix.run/docs" rel="noreferrer">
            Remix Docs
          </a>
        </li>
        <li>
          <Link to="/docs">docs</Link>
        </li>
        <li>
          <button
            onClick={() => {
              navigate('/docs');
            }}>
            Go to Docs
          </button>
        </li>
      </ul>
      <ul>
        {locales.map((item) => {
          return (
            <li key={item}>
              <SwitchLocaleLink locale={item}>{item}</SwitchLocaleLink>
            </li>
          );
        })}
      </ul>

      <Form method="post">
        <input type="text" name="title" />
        {actionData?.errors?.title ? <em>{actionData?.errors.title}</em> : null}
        <button type="submit">Create Todo</button>
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
  return redirect(request.url);
}
