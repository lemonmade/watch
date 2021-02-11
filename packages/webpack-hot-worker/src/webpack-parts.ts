import {DefinePlugin, EntryPlugin, HotModuleReplacementPlugin} from 'webpack';
import type {Compiler} from 'webpack';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ParserHelpers = require('webpack/lib/ParserHelpers');

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
      compiler.hooks.make.tapPromise(
        'WatchDevServerPlugin',
        async (compilation) => {
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
        },
      );

      if (socketUrl) {
        const definePlugin = new DefinePlugin({
          __DEV_SERVER_HOT_ENDPOINT__: JSON.stringify(socketUrl),
        });
        definePlugin.apply(compiler);
      }

      compiler.hooks.compilation.tap(PLUGIN, (_, {normalModuleFactory}) => {
        const handler = (parser: any) => {
          parser.hooks.evaluateIdentifier.for('module.hot').tap(
            {
              name: PLUGIN,
              before: 'NodeStuffPlugin',
            } as any,
            (expr: any) =>
              ParserHelpers.evaluateToIdentifier(
                'module.hot',
                Boolean(parser.state.compilation.hotUpdateChunkTemplate),
              )(expr),
          );
        };

        normalModuleFactory.hooks.parser
          .for('javascript/auto')
          .tap(PLUGIN, handler);
        normalModuleFactory.hooks.parser
          .for('javascript/dynamic')
          .tap(PLUGIN, handler);
      });

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
