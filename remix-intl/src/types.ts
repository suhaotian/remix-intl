/**
 * `segment` mode url example: http://example.com/en
 *
 * `search` mode url example: http://example.com/?lang=en
 */
export type Mode = 'segment' | 'search';

export interface GetLocalesRes {
  locales: string[];
}

export interface GetMessagesRes {
  messages: { [key: string]: unknown };
  locale: string;
  ns?: string;
}

export default {};
