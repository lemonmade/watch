import type {Ui} from '../../ui';
import {
  authenticate,
  userFromLocalAuthentication,
} from '../../utilities/authentication';

export async function signIn({ui, debug}: {ui: Ui; debug?: boolean}) {
  const existingUser = await userFromLocalAuthentication({ui, debug});

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

  const user = await authenticate({ui, debug});

  ui.Heading('success!', {style: (content, style) => style.green(content)});
  ui.TextBlock(
    `You’re authenticated as ${ui.Code(user.email)}. You can now run ${ui.Code(
      'watchapp push',
    )} and ${ui.Code(
      'watchapp publish',
    )} to stage and commit changes to your application. Have fun!`,
  );
}
