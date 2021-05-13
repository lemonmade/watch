import type {Ui} from '../ui';
import {deleteAuthentication} from '../authentication';

export async function signOut({ui}: {ui: Ui}) {
  await deleteAuthentication();

  ui.Heading('success!', {style: (content, style) => style.green(content)});
  ui.TextBlock(
    `We’ve removed all local authentication with Watch. You’ll need to run ${ui.Code(
      'watchapp sign-in',
    )} to deploy changes to your application in the future.`,
  );
}
