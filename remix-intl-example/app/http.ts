import { xior } from 'xior';
import errorRetryPlugin from 'xior/plugins/error-retry';
import errorCachePlugin from 'xior/plugins/error-cache';
import dedupeRequestPlugin from 'xior/plugins/dedupe';
import throttlePlugin from 'xior/plugins/throttle';
import { isClient } from 'remix-intl/utils';

export const http = xior.create({
  baseURL: !isClient ? 'http://localhost:' + process.env.PORT : '',
  timeout: 1000 * 60 * 2,
});
http.plugins.use(throttlePlugin({ threshold: 1 * 1000 }));
http.plugins.use(
  errorRetryPlugin({
    retryTimes: 3,
    retryInterval(count) {
      return count * 250;
    },
    onRetry(config, error, count) {
      console.log(`${config?.method} ${config?.url} retry ${count}`);
    },
  })
);
http.plugins.use(errorCachePlugin());
http.plugins.use(
  dedupeRequestPlugin({
    onDedupe(config) {
      console.log(`Dedupe ${config.method} ${config.url}`);
    },
  })
);
