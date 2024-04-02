import './i18n';

import { createSharedPathnamesNavigation } from 'remix-intl/navigation';

const { Link, NavLink, useNavigate, SwitchLocaleLink } = createSharedPathnamesNavigation();

export { Link, NavLink, useNavigate, SwitchLocaleLink };
