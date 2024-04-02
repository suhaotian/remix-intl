import type { UserConfig } from 'vite';

/**
 *
 * @param i18nConfigAbsolutePath absolute i18n config path @type string
 * @param viteConfig vite cofnig @type UserConfig
 * @returns
 */
export default function init(i18nConfigAbsolutePath: string, viteConfig: UserConfig = {}) {
  if (!viteConfig.resolve) {
    viteConfig.resolve = {
      alias: [],
    };
  }
  if (!viteConfig.resolve.alias) {
    viteConfig.resolve.alias = [];
  }
  if (Array.isArray(viteConfig.resolve?.alias)) {
    viteConfig.resolve.alias.push({
      find: 'remix-intl/i18n',
      replacement: i18nConfigAbsolutePath,
    });
  } else if (viteConfig.resolve?.alias) {
    (viteConfig.resolve.alias as Record<string, any>)['remix-intl/i18n'] = i18nConfigAbsolutePath;
  }
  return viteConfig;
}
