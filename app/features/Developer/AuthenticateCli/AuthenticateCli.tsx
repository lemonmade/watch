import type {ReactNode} from 'preact';
import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {BlockStack, TextBlock, Text, Action, TextLink} from '@lemon/zest';

import {Page} from '~/shared/page.ts';

import {useAuthenticateCliWithAccessToken} from '../shared/cli';

export default function AuthenticateCli() {
  usePerformanceNavigation({state: 'complete'});

  const authenticateCliWithAccessToken = useAuthenticateCliWithAccessToken();

  let content: ReactNode;

  if (authenticateCliWithAccessToken.isSuccess) {
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
  } else if (authenticateCliWithAccessToken.isError) {
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
          A local server running on{' '}
          <Text>{authenticateCliWithAccessToken.target}</Text> wants to
          authenticate as you. If you recently ran a command in the CLI that
          indicated you needed to authenticate, you can click the button below
          to allow the CLI to perform actions on your behalf.
        </TextBlock>
        <TextBlock>
          If you want to revoke access to this token in the future, you can do
          so on the{' '}
          <TextLink to="/app/developer/access-tokens">
            access tokens page
          </TextLink>
          .
        </TextBlock>
        <Action
          onPress={async () => {
            await authenticateCliWithAccessToken.perform();
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
