# Creating extensions

## Creating a new app

<!-- TODO -->

## Adding to an existing app

A single app can provide multiple extensions. If you already have an app, you can add an extension by running any of the following commands, from a terminal with the current working directory set to your app’s root directory:

```bash
# pnpm
pnpm create @watching extension
# yarn
yarn create @watching extension
# npm
yarn create @watching extension
```

Alternatively, the `watchapp` command line interface has a `create` command, which can be used for projects that already have [`@watching/cli`](../../packages/cli) installed.

```bash
# pnpm
pnpm watchapp create extension
# yarn
npm run watchapp create extension
# npm
yarn watchapp create extension
```

When you create an extension, you will first be asked to give it a name. You should use a short, friendly name that describes what the extension does, as this name will be shown to users anytime your extension is rendered. The name will also be used as the basis for the directory name of the extension. If you want to provide a name without a manual prompt, you can do so by passing the `--name` flag to the `create` command (for example, `pnpm watchapp create extension --name "Season rankings"`).

Extensions are created in an `extensions` directory by default. You can configure a different glob pattern to match for extension directories in your app’s `app.toml` settings file, and we will attempt to guess the right directory to put your new extension in. If you want to force the create command to choose a particular directory, you can pass the `--directory` flag to the `create` command. This should be the **full** directory name you want to use, relative to the directory in which you ran the create command. For example, `pnpm watchapp create extension --directory app/extensions/season-rankings` would output the new extension in the `app/extensions/season-rankings` directory of your project.

## Templates

When you create a new extension, you will be asked what template you’d like to start from. Here is a bit more detail on the templates you can create:

- **Series accessory**: your new extension will target the [`Series.Details.RenderAccessory` extension point](TODO). This extension point renders in the main column of the details screen for a single TV series, below the key details about the series.

  You can use this extension point to render additional content about the series. For example, you might render content that references a public wiki about the series, or provide details about the people involved with the series.

- **Watch-through accessory**: your new extension will target the [`WatchThrough.Details.RenderAccessory` extension point](TODO). This extension point appears directly below the section on a series watch-through where the user records the the episodes of the series they are watching.

  You can use this extension to render additional content about a series that is actively being watched. For example, you could provide a UI that shows theories about a season with a juicy mystery, allow users to draft contestants for a reality show, or link to additional information about the series.

> **Tip:** When running the create command, you can pass the `--template` flag to pre-select one of these templates. For example, `pnpm watchapp create extension --template watch-through-accessory` will create a watch-through accessory extension without any additional prompt.

## Formats

You can write extensions in a number of different formats, each suited to developers with different preferences and background. Regardless of which template you choose, you’ll also be asked to choose which of the following formats to use for your new extension:

The [**Basic**](TODO) template provides a friendly, “vanilla” JavaScript (or TypeScript) API for creating extensions. It provides a [remote-ui `RemoteRoot` object](https://github.com/Shopify/remote-ui/tree/main/packages/core) that allows you to construct your UI using a small, type-safe API. It has the least amount of overhead, so you’ll produce the smallest bundle size with this format; this makes it the best approach for simple, mostly-static extensions.

```ts
import {extension, Text} from '@watching/clips';

export default extension((root, {target}) => {
  root.append(
    root.createComponent(Text, {}, [
      'You are rendering in the ',
      root.createComponent(Text, {emphasis: true}, target),
      ' extension point!',
    ]),
  );
});
```

The [**React**](TODO) template lets you write your extension as a [React](https://reactjs.org) component. It provides type-safe React components and easy-to-use hooks for using the APIs available to an extension. Under the hood, this version actually uses [Preact](https://preactjs.com), but it does so in a way that should allow dependencies expecting the “real” React to continue to work correctly.

```tsx
import {extension, Text, useApi} from '@watching/clips-react';

export function Extension() {
  const {target} = useApi();

  return (
    <Text>
      You are rendering in the <Text emphasis>{target}</Text> extension point!
    </Text>
  );
}

export default extension(() => <Extension />);
```

The [**DOM**](TODO) template provides a simulated DOM environment, which allows you to bring existing code that knows how to work on the DOM. The most important browser globals are made available to your extension, and gives you an HTML element that will map HTML elements into native UI components. This format is great for folks who already know the DOM APIs:

```ts
import {extension, Text} from '@watching/clips-dom';

export default extension((root, {target}) => {
  const targetElement = document.createElement(Text);

  targetElement.emphasis = true;
  targetElement.textContent = target;

  const textElement = document.createElement(Text);
  textElement.append(
    'You are rendering in the ',
    targetElement,
    ' extension point!',
  );

  root.append(textElement);
});
```

If you have a favorite JavaScript framework that works with the DOM, you should be able to use it with this “simulated” DOM format. Here’s an example of an extension using [Vue.js](https://vuejs.org):

```ts
// Make sure you import @watching/clips-dom first, as it adds the browser globals that
// allow Vue to work.
import {extension, Text} from '@watching/clips-dom';
import {h, createApp} from 'vue';

export default extension((root, {target}) => {
  createApp({
    render() {
      return h(Text, {}, [
        'You are rendering in the ',
        h(Text, {emphasis: true}, target),
        ' extension point!',
      ]);
    },
  }).mount(root);
});
```

> **Tip:** When running the create command, you can pass the `--format` flag to pre-select one of these formats. For example, `pnpm watchapp create extension --format react` will create a React extension, and `pnpm watchapp create extension --format dom` will create an a DOM one.

## Languages

You can write an extension in both [TypeScript](https://www.typescriptlang.org) and “vanilla” JavaScript. We recommend using TypeScript, as we provide strong types for all extension APIs. However, if you want to use JavaScript, you can choose it when prompted by the `create` command.

> **Tip:** When running the create command, you can pass the `--language` flag to pre-select the extension’s programming language. `pnpm watchapp create extension --language typescript` will create a TypeScript, and `pnpm watchapp create extension --language javascript` will create an a JavaScript one.
