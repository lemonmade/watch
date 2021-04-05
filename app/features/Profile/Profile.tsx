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
        <Button
          onPress={async () => {
            await deleteAccount();
            navigate('/login');
          }}
        >
          Delete account
        </Button>
        {githubAccount && <GithubProfile {...githubAccount} />}
      </BlockStack>
    </Page>
  );
}

function GithubProfile({
  profileUrl,
  username,
}: Omit<ProfileQueryData.Me.GithubAccount, '__typename'>) {
  return (
    <Section>
      <BlockStack>
        <Heading>Github account</Heading>
        <TextBlock>username: {username}</TextBlock>
        <Link to={profileUrl}>Visit profile</Link>
      </BlockStack>
    </Section>
  );
}
