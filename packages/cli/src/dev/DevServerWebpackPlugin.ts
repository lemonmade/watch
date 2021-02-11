import {
  Compiler,
  DefinePlugin,
  EntryPlugin,
  HotModuleReplacementPlugin,
} from 'webpack';

export class DevServerWebpackPlugin {
  apply(compiler: Compiler) {
    const compilerOptions = compiler.options;
    const shouldInject =
      compilerOptions.externalsPresets?.web ??
      ['web', 'webworker', undefined, null].includes(
        compilerOptions.target as string | undefined,
      );

    if (shouldInject) {
      compiler.hooks.make.tapPromise(
        'WatchDevServerPlugin',
        async (compilation) => {
          await new Promise<void>((resolve, reject) => {
            compilation.addEntry(
              compiler.context,
              EntryPlugin.createDependency('@watching/cli/hot-client', {}),
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

      const definePlugin = new DefinePlugin({
        __DEV_SERVER_HOT_ENDPOINT__: JSON.stringify('ws://localhost:3000/ws'),
      });
      definePlugin.apply(compiler);

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
