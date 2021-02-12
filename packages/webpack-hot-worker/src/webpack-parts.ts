import {DefinePlugin, EntryPlugin, HotModuleReplacementPlugin} from 'webpack';
import type {Compiler} from 'webpack';

const PLUGIN = 'DevServerWebpackPlugin';

export interface Options {
  readonly socketUrl?: string;
  readonly hotEntry?: string;
}

export class DevServerWebpackPlugin {
  constructor(private readonly options: Options = {}) {}

  apply(compiler: Compiler) {
    const {socketUrl, hotEntry} = this.options;
    const compilerOptions = compiler.options;
    const shouldInject =
      Boolean(hotEntry) &&
      (compilerOptions.externalsPresets?.web ??
        ['web', 'webworker', undefined, null].includes(
          compilerOptions.target as string | undefined,
        ));

    if (shouldInject) {
      compiler.hooks.make.tapPromise(PLUGIN, async (compilation) => {
        await new Promise<void>((resolve, reject) => {
          compilation.addEntry(
            compiler.context,
            EntryPlugin.createDependency(hotEntry!, {}),
            {},
            (error) => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            },
          );
        });
      });

      if (socketUrl) {
        const definePlugin = new DefinePlugin({
          __DEV_SERVER_HOT_ENDPOINT__: JSON.stringify(socketUrl),
        });
        definePlugin.apply(compiler);
      }

      if (
        !compilerOptions.plugins?.some(
          (plugin) => plugin.constructor === HotModuleReplacementPlugin,
        )
      ) {
        const plugin = new HotModuleReplacementPlugin();
        plugin.apply(compiler);
      }
    }
  }
}
