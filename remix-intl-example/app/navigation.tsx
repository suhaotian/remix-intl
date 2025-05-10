import { setupIntlConfig } from './i18n';
import { createSharedPathnamesNavigation } from 'remix-intl/navigation';

setupIntlConfig();

const { Link, NavLink, useNavigate, SwitchLocaleLink } = createSharedPathnamesNavigation();

export { Link, NavLink, useNavigate, SwitchLocaleLink };
