import type {ReactNode} from 'react';
import {useMutation as useBasicMutation} from 'react-query';

import {useCurrentUrl, Redirect} from '@quilted/quilt';
import {BlockStack, TextBlock, Text, Action} from '@lemon/zest';

import {Page} from '~/shared/page';
import {useMutation} from '~/shared/graphql';

import createAccessTokenForCliMutation from './graphql/CreateAccessTokenForCliMutation.graphql';

enum SearchParams {
  RedirectTo = 'redirect',
}

export function AuthenticateCli() {
  const currentUrl = useCurrentUrl();
  const redirectTo = currentUrl.searchParams.get(SearchParams.RedirectTo);

  const createAccessTokenForCli = useMutation(createAccessTokenForCliMutation);
  const pingCliWithToken = useBasicMutation(
    async ({token}: {token?: string}) => {
      const result = await fetch(redirectTo!, {
        method: 'POST',
        body: JSON.stringify(token ? {token} : {error: 'generic'}),
      });

      if (!result.ok) throw new Error();

      return true;
    },
  );

  if (!redirectIsValid(redirectTo)) {
    return <Redirect to="/app" />;
  }

  let content: ReactNode;

  if (pingCliWithToken.isSuccess) {
    content = (
      <BlockStack spacing>
        <TextBlock>
          The CLI has been authenticated successfully! Your command should have
          continued running in the background, and might even already be
          finished!
        </TextBlock>
        <ClosePageCallToAction />
      </BlockStack>
    );
  } else if (pingCliWithToken.isError) {
    content = (
      <BlockStack spacing>
        <TextBlock>
          Something went wrong while authenticating the CLI. You’ll need to
          check the output in your terminal for details, and to restart the
          authentication flow. Sorry about that!
        </TextBlock>
        <ClosePageCallToAction />
      </BlockStack>
    );
  } else {
    content = (
      <BlockStack spacing>
        <TextBlock>
          A local server running on <Text>{redirectTo}</Text> wants to
          authenticate as you. If you recently ran a command in the CLI that
          indicated you needed to authenticate, you can click the button below
          to allow the CLI to perform actions on your behalf.
        </TextBlock>
        <TextBlock>
          If you want to revoke access to this token in the future, you can do
          so on the{' '}
          <Action to="/app/developer/access-tokens">access tokens page</Action>.
        </TextBlock>
        <Action
          onPress={async () => {
            createAccessTokenForCli.mutate(
              {
                label: 'Watch CLI Authentication',
              },
              {
                async onSuccess({createPersonalAccessToken}) {
                  pingCliWithToken.mutate({
                    token:
                      createPersonalAccessToken?.plaintextToken ?? undefined,
                  });
                },
              },
            );
          }}
        >
          Authenticate the CLI
        </Action>
      </BlockStack>
    );
  }

  return <Page heading="Authenticate the Watch CLI">{content}</Page>;
}

// Would be nice to have a action to close the window, but I can’t do it in
// JavaScript, and feels like a lot of finicky work to do from the CLI.
function ClosePageCallToAction() {
  return (
    <TextBlock>
      Feel free to close this window if you don’t need it for anything else.
    </TextBlock>
  );
}

function redirectIsValid(redirect?: string | null) {
  if (redirect == null) return false;

  try {
    const redirectUrl = new URL(redirect);
    return redirectUrl.hostname === 'localhost';
  } catch {
    return false;
  }
}
