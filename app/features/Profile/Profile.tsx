import {useQuery, useMutation, useNavigate} from '@quilted/quilt';
import {NotFound} from '@quilted/quilt/http';

import {
  Heading,
  TextBlock,
  BlockStack,
  Button,
  Section,
  Link,
} from '@lemon/zest';

import {Page} from 'components';

import profileQuery from './graphql/ProfileQuery.graphql';
import type {ProfileQueryData} from './graphql/ProfileQuery.graphql';
import deleteAccountMutation from './graphql/DeleteAccountMutation.graphql';

export function Profile() {
  const navigate = useNavigate();
  const {data} = useQuery(profileQuery);
  const deleteAccount = useMutation(deleteAccountMutation);

  if (data == null) return <NotFound />;

  const {email, githubAccount} = data.me;

  return (
    <Page heading="Profile">
      <BlockStack>
        <TextBlock>Email: {email}</TextBlock>
        <GithubSection account={githubAccount ?? undefined} />
        <Section>
          <BlockStack>
            <Heading>Danger zone</Heading>
            <Button
              onPress={async () => {
                await deleteAccount();
                navigate('/login');
              }}
            >
              Delete account
            </Button>
          </BlockStack>
        </Section>
      </BlockStack>
    </Page>
  );
}

function GithubSection({
  account,
}: {
  account?: ProfileQueryData.Me.GithubAccount;
}) {
  if (account == null) {
    return (
      <Section>
        <BlockStack>
          <Heading>Github account</Heading>
          <TextBlock>
            Connecting your Github account lets you sign in with Github
          </TextBlock>
          <Link
            to={(currentUrl) => {
              const target = new URL(
                '/internal/auth/github/connect',
                currentUrl,
              );
              target.searchParams.set('redirect', currentUrl.pathname);
              return target;
            }}
          >
            Connect Github
          </Link>
        </BlockStack>
      </Section>
    );
  }

  const {username, profileUrl} = account;

  return (
    <Section>
      <BlockStack>
        <Heading>Github account</Heading>
        <TextBlock />
        <TextBlock>username: {username}</TextBlock>
        <Link to={profileUrl} target="newTab">
          Visit profile
        </Link>
      </BlockStack>
    </Section>
  );
}
