import arg from 'arg';
import {bold, magenta, red, blue, green, yellow} from 'colorette';

const KNOWN_COMMANDS = new Set(['dev', 'build', 'push', 'publish']);

run();

async function run() {
  const args = arg({});

  const {
    _: [command],
  } = args;

  if (command == null) {
    throw new Error(
      `You must call the CLI with a command (e.g., \`watchapp deploy\`)`,
    );
  }

  console.log(
    `${magenta(`watch ${bold(command)}`)} ${magenta('●')}${red('●')}${blue(
      '●',
    )}${green('●')}${yellow('●')}`,
  );

  switch (command) {
    case 'dev': {
      const {dev} = await import('./dev');
      await dev();
      break;
    }
    case 'build': {
      const {build} = await import('./build');
      await build();
      break;
    }
    case 'push': {
      const {push} = await import('./push');
      await push();
      break;
    }
    case 'publish': {
      const {publish} = await import('./publish');
      await publish();
      break;
    }
    default: {
      throw new Error(
        `Unrecognized command: \`${command}\`. Must be one of the following: ${[
          ...KNOWN_COMMANDS,
        ]
          .map((command) => `\`${command}\``)
          .join(', ')}`,
      );
    }
  }
}
