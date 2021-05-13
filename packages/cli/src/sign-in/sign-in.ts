import type {Ui} from '../ui';
import {authenticate, userFromLocalAuthentication} from '../authentication';

export async function signIn({ui}: {ui: Ui}) {
  const existingUser = await userFromLocalAuthentication();

  if (existingUser) {
    ui.Heading('success!', {style: (content, style) => style.green(content)});
    ui.TextBlock(
      `You’re already authenticated as ${ui.Code(
        existingUser.email,
      )}. If you want to sign in with a different account, run ${ui.Code(
        'watchapp sign-out',
      )} before running this command again.`,
    );
    return;
  }

  const user = await authenticate({ui});

  ui.Heading('success!', {style: (content, style) => style.green(content)});
  ui.TextBlock(
    `You’re authenticated as ${ui.Code(user.email)}. You can now run ${ui.Code(
      'watchapp push',
    )} and ${ui.Code(
      'watchapp publish',
    )} to stage and commit changes to your application. Have fun!`,
  );
}
