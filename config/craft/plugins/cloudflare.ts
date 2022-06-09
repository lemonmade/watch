import {createProjectPlugin, MAGIC_MODULE_HTTP_HANDLER} from '@quilted/craft';
import type {WaterfallHook} from '@quilted/craft/kit';

export function proxiedByCloudflare() {
  return createProjectPlugin({
    name: 'Cloudflare.Worker.ProxyConfiguration',
    build({configure}) {
      configure((configuration) => {
        // TODO make this better
        const {quiltHttpHandlerRuntimeContent} = configuration as any as {
          quiltHttpHandlerRuntimeContent?: WaterfallHook<string | undefined>;
        };

        quiltHttpHandlerRuntimeContent?.(() => {
          return `
            import httpHandler from ${JSON.stringify(
              MAGIC_MODULE_HTTP_HANDLER,
            )};

            import {createHttpServer, transformRequest} from '@quilted/quilt/http-handlers/node';

            const port = Number.parseInt(process.env.PORT, 10);
            const host = process.env.HOST;
          
            createHttpServer(httpHandler, {
              async transformRequest(request) {
                const base = await transformRequest(request);
                return {...base, url: new URL(request.url, 'https://' + request.headers['cf-worker'])};
              }
            }).listen(port, host);
          `;
        });
      });
    },
  });
}
