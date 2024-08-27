import {useCurrentURL} from '@quilted/quilt/navigation';
import {useAsyncMutation} from '@quilted/quilt/async';

import {useGraphQLMutation} from '~/shared/graphql.ts';

import createAccessTokenForCliMutation, {
  type CreateAccessTokenForCliMutationData,
} from './graphql/CreateAccessTokenForCliMutation.graphql';

export enum SearchParams {
  Connect = 'connect',
}

interface AuthenticateWithCliAccessTokenOptions<Message = unknown> {
  label?: string;
  connect?: string;
  handleToken?(
    result: CreateAccessTokenForCliMutationData,
  ): Message | Promise<Message>;
}

const DEFAULT_CLI_ACCESS_TOKEN_LABEL = 'Watch CLI Authentication';

export function useAuthenticateCliWithAccessToken<
  Message = unknown,
  Result = unknown,
>({
  label = DEFAULT_CLI_ACCESS_TOKEN_LABEL,
  connect: explicitConnectTo,
  handleToken = handleTokenDefault as any,
}: AuthenticateWithCliAccessTokenOptions<Message> = {}) {
  const currentUrl = useCurrentURL();
  const connectTo =
    explicitConnectTo ?? currentUrl.searchParams.get(SearchParams.Connect);

  if (connectTo == null) {
    throw new Error(
      'No connect URL provided to useAuthenticateCliWithAccessToken',
    );
  }

  const createAccessTokenForCli = useGraphQLMutation(
    createAccessTokenForCliMutation,
  );

  const pingCli = useAsyncMutation(
    async (result: CreateAccessTokenForCliMutationData) => {
      const message = await handleToken(result);
      const response = await fetch(connectTo!, {
        method: 'POST',
        body: JSON.stringify(message),
        headers: {
          'Content-Type': 'application/json',
        },
        // @see https://github.com/nodejs/node/issues/46221
        ...{duplex: 'half'},
      });

      if (!response.ok) throw new Error();

      const json = await response.json();
      return json as Result;
    },
  );

  return {
    target: connectTo,
    isError: Boolean(createAccessTokenForCli.error || pingCli.error),
    isSuccess:
      pingCli.finished != null && pingCli.finished.status === 'resolved',
    async perform() {
      const tokenResult = await createAccessTokenForCli.run({label});

      if (tokenResult.data == null) {
        throw new Error('Failed to create CLI access token');
      }

      const pingResult = await pingCli.run(tokenResult.data);
      return pingResult;
    },
  };
}

async function handleTokenDefault(result: CreateAccessTokenForCliMutationData) {
  const {createPersonalAccessToken} = result;

  if (createPersonalAccessToken == null) return;

  const {plaintextToken} = createPersonalAccessToken;

  return plaintextToken ? {token: plaintextToken} : {error: 'generic'};
}
