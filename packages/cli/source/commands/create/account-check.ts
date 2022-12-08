import '@quilted/polyfills/fetch';

import {prompt} from '@quilted/cli-kit';

import type {Ui} from '../../ui';
import {watchUrl} from '../../utilities/url';
import {
  hasLocalAuthentication,
  authenticateFromWebAuthentication,
} from '../../utilities/authentication';

export async function checkForAccount({ui}: {ui: Ui}) {
  if (await hasLocalAuthentication()) return;

  ui.Spacer();

  const hasAccount = await prompt({
    type: 'confirm',
    message: `Do you already have an account on ${ui.Text(
      'https://watch.lemon.tools',
      {emphasized: true},
    )}?`,
  });

  // We will authenticate as-needed later
  if (hasAccount) return;

  ui.TextBlock(
    'To preview the apps you develop, you’ll need to create an account.',
  );
  ui.Spacer();

  await prompt({
    type: 'select',
    message: `How would you like to create your account?`,
    choices: [{title: 'Github', value: 'github'}],
  });

  await authenticateFromWebAuthentication({
    ui,
    to({urlWithConnect}) {
      const redirectUrl = urlWithConnect('/app/developer/cli/created-account');
      const url = watchUrl('/internal/auth/github/create-account');
      url.searchParams.set('redirect', redirectUrl.href);
      return url;
    },
  });

  ui.Spacer();
}
