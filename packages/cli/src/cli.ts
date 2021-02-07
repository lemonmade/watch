import arg from 'arg';

import {build} from './build';
import {deploy} from './deploy';

const KNOWN_COMMANDS = new Set(['build', 'deploy']);

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
    case 'deploy': {
      await deploy();
      break;
    }
    case 'build': {
      await build();
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
