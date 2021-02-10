import arg from 'arg';

const KNOWN_COMMANDS = new Set(['build', 'deploy', 'dev']);

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

  switch (command) {
    case 'build': {
      const {build} = await import('./build');
      await build();
      break;
    }
    case 'deploy': {
      const {deploy} = await import('./deploy');
      await deploy();
      break;
    }
    case 'dev': {
      const {dev} = await import('./dev');
      await dev();
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
