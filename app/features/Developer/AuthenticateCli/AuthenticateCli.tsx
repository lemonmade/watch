import {useState} from 'react';
import type {ReactNode} from 'react';

import {useCurrentUrl, Redirect, useMutation} from '@quilted/quilt';
import {BlockStack, TextBlock, Text, Link, Button} from '@lemon/zest';

import {Page} from 'components';

import createAccessTokenForCliMutation from './graphql/CreateAccessTokenForCliMutation.graphql';

enum SearchParams {
  RedirectTo = 'redirect',
}

export function AuthenticateCli() {
  const [result, setResult] = useState<'success' | 'error'>();
  const currentUrl = useCurrentUrl();
  const redirectTo = currentUrl.searchParams.get(SearchParams.RedirectTo);
  const createAccessTokenForCli = useMutation(createAccessTokenForCliMutation);

  if (!redirectIsValid(redirectTo)) {
    return <Redirect to="/app" />;
  }

  let content: ReactNode;

  if (result === 'success') {
    content = (
      <BlockStack>
        <TextBlock>
          The CLI has been authenticated successfully! Your command should have
          continued running in the background, and might even already be
          finished!
        </TextBlock>
        <ClosePageCallToAction />
      </BlockStack>
    );
  } else if (result === 'error') {
    content = (
      <BlockStack>
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
      <BlockStack>
        <TextBlock>
          A local server running on <Text>{redirectTo}</Text> wants to
          authenticate as you. If you recently ran a command in the CLI that
          indicated you needed to authenticate, you can click the button below
          to allow the CLI to perform actions on your behalf.
        </TextBlock>
        <TextBlock>
          If you want to revoke access to this token in the future, you can do
          so on the{' '}
          <Link to="/app/developer/access-tokens">access tokens page</Link>.
        </TextBlock>
        <Button
          onPress={async () => {
            const {data} = await createAccessTokenForCli({
              variables: {
                label: 'Watch CLI Authentication',
              },
            });

            const plaintextToken =
              data?.createPersonalAccessToken?.plaintextToken;

            try {
              const result = await fetch(redirectTo!, {
                method: 'POST',
                body: JSON.stringify(
                  plaintextToken ? {token: plaintextToken} : {error: 'generic'},
                ),
              });

              setResult(result.ok ? 'success' : 'error');
            } catch (error) {
              setResult('error');
            }
          }}
        >
          Authenticate the CLI
        </Button>
      </BlockStack>
    );
  }

  return <Page heading="Authenticate the Watch CLI">{content}</Page>;
}

// Would be nice to have a button to close the window, but I can’t do it in
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
