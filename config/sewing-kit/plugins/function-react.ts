import {
  createProjectPlugin,
  createComposedProjectPlugin,
} from '@sewing-kit/plugins';
import {react} from '@sewing-kit/plugin-react';
import {updateBabelPreset} from '@sewing-kit/plugin-javascript';

const PLUGIN = 'Watch.FunctionReact';

export function functionReact({preact = false} = {}) {
  return createComposedProjectPlugin(PLUGIN, (composer) => {
    composer.use(
      react({preact, fastRefresh: false}),
      reactJsxRuntime({preact}),
    );
  });
}

// eslint-disable-next-line no-warning-comments
// TODO: should be in the React plugin
function reactJsxRuntime({preact = false} = {}) {
  return createProjectPlugin(`${PLUGIN}.JsxRuntime`, ({tasks}) => {
    const updateReactBabelPreset = updateBabelPreset(['@babel/preset-react'], {
      runtime: 'automatic',
      importSource: preact ? 'preact' : 'react',
    });

    tasks.build.hook(({hooks}) => {
      hooks.target.hook(({hooks}) => {
        hooks.configure.hook(({babelConfig}) => {
          babelConfig?.hook(updateReactBabelPreset);
        });
      });
    });

    tasks.dev.hook(({hooks}) => {
      hooks.configure.hook(({babelConfig}) => {
        babelConfig?.hook(updateReactBabelPreset);
      });
    });

    tasks.test.hook(({hooks}) => {
      hooks.configure.hook(({babelConfig}) => {
        babelConfig?.hook(updateReactBabelPreset);
      });
    });
  });
}
