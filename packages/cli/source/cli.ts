import arg from 'arg';
import {bold, magenta, red, blue, dim} from 'colorette';
import {AbortError} from '@quilted/events';

import {createUi, PrintableError} from './ui';

const KNOWN_COMMANDS = new Set([
  'sign-in',
  'sign-out',
  'develop',
  'build',
  'create',
  'push',
  'publish',
]);

run();

async function run() {
  const args = arg({}, {permissive: true, stopAtPositional: true});

  const {
    _: [command, ...remainingArgs],
  } = args;

  // eslint-disable-next-line no-console
  console.log(
    `${magenta(`watch ${bold(command!)}`)} ${magenta('●')}${red('●')}${blue(
      '●',
    )}`,
  );

  const ui = createUi();

  try {
    if (command == null) {
      throw new PrintableError(
        (ui) =>
          `You must call the CLI with a command (e.g., ${ui.Code(
            'watchapp deploy',
          )})`,
      );
    }

    switch (command) {
      case 'sign-in': {
        const {signIn} = await import('./commands/sign-in');
        await signIn({ui});
        break;
      }
      case 'sign-out': {
        const {signOut} = await import('./commands/sign-out');
        await signOut({ui});
        break;
      }
      case 'create': {
        const {create} = await import('./commands/create');
        await create({ui});
        break;
      }
      case 'develop': {
        const {develop} = await import('./commands/develop');
        const {'--proxy': proxy} = arg(
          {'--proxy': String},
          {argv: remainingArgs, permissive: true},
        );

        await develop({ui, proxy});
        break;
      }
      case 'build': {
        const {build} = await import('./commands/build');
        await build({ui});
        break;
      }
      case 'push': {
        const {push} = await import('./commands/push');
        await push({ui});
        break;
      }
      case 'publish': {
        const {publish} = await import('./commands/publish');
        await publish({ui});
        break;
      }
      default: {
        throw new PrintableError(
          (ui) =>
            `${ui.Code(
              command,
            )} is not a command this app knows how to handle. You can only call one of the following commands: ${[
              ...KNOWN_COMMANDS,
            ]
              .map((command) => ui.Code(command))
              .join(', ')}`,
        );
      }
    }

    // eslint-disable-next-line no-console
    console.log();
  } catch (error) {
    if (error instanceof AbortError) {
      return;
    }

    if (error instanceof PrintableError) {
      error.print(ui);
    } else {
      new PrintableError(
        (ui) =>
          `An error happened that we didn’t handle properly. The full content of the error is below, and we’d really appreciate if you could open an issue on ${ui.Link(
            'https://github.com/lemonmade/watch/issues/new',
          )} so we can figure out how to stop this from happening again.`,
      ).print(ui);

      /* eslint-disable no-console */
      console.log();
      console.log(dim((error as any).stack));
      /* eslint-enable no-console */
    }

    process.exitCode = 1;
  }
}
