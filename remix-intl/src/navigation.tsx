import {
  Link,
  NavLink,
  useNavigate,
  LinkProps,
  NavLinkProps,
  NavigateFunction,
  useLocation,
} from '@remix-run/react';
import React from 'react';
// @ts-ignore
import i18n, { mode, paramKey, getMessages, defaultNS } from 'remix-intl/i18n';
// @ts-ignore
import { useLocale } from 'remix-intl/react';

export function createSharedPathnamesNavigation() {
  function getPath(toPathname: string, locale: string, replaceLocale = false) {
    const isSearchParamMode = mode === 'search';
    if (!isSearchParamMode) {
      if (replaceLocale) {
        const pathArr = toPathname.split('/');
        pathArr[1] = locale;
        return pathArr.join('/');
      } else {
        toPathname = toPathname.startsWith('/') ? '/' + locale + toPathname : toPathname;
      }
    } else {
      if (toPathname.startsWith('/')) {
        const urlObj = new URL('http://localhost' + toPathname);
        urlObj.searchParams.set(paramKey, locale);
        toPathname = urlObj.pathname + '?' + urlObj.searchParams.toString() + urlObj.hash;
      }
    }
    return toPathname;
  }

  function SwitchLocaleLink({
    locale,
    onClick,
    ...props
  }: Omit<LinkProps, 'to'> & { locale: string }) {
    const location = useLocation();
    const navigate = useNavigate();
    const toPathname = location.pathname + location.search + location.hash;
    const to = getPath(toPathname, locale, true);
    async function handleClick(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
      if (!props.reloadDocument) {
        e.preventDefault();
        const { messages } = await getMessages(locale);
        i18n.addResourceBundle(locale, defaultNS, messages);
        navigate(to, props);
      }
      onClick && onClick(e);
    }
    return <Link {...props} to={to} onClick={handleClick} />;
  }

  function LinkIntl({ to, ...props }: LinkProps) {
    const locale = useLocale();
    const toPathname = typeof to === 'string' ? to : to.toString();
    return <Link {...props} to={getPath(toPathname, locale)} />;
  }

  function NavLinkIntl({ to, ...props }: NavLinkProps) {
    const locale = useLocale();
    const toPathname = typeof to === 'string' ? to : to.toString();
    return <NavLink {...props} to={getPath(toPathname, locale)} />;
  }

  function useNavigateIntl() {
    const navigate = useNavigate();
    const locale = useLocale();

    const navigateIntl = (to: any, options?: any) => {
      if (typeof to === 'number') {
        return navigate(to);
      } else if (typeof to === 'string') {
        return navigate(getPath(to, locale), options);
      } else if (to && typeof to.pathname === 'string') {
        return navigate({ ...to, pathname: getPath(to.pathname, locale) }, options);
      }
      return navigate(to, options);
    };

    return navigateIntl as NavigateFunction;
  }

  return {
    Link: LinkIntl,
    NavLink: NavLinkIntl,
    useNavigate: useNavigateIntl,
    SwitchLocaleLink,
  };
}
