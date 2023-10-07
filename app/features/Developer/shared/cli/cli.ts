import {useMutation as useBasicMutation} from '@tanstack/react-query';

import {useCurrentUrl} from '@quilted/quilt/navigate';

import {useMutation} from '~/shared/graphql.ts';

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
  const currentUrl = useCurrentUrl();
  const connectTo =
    explicitConnectTo ?? currentUrl.searchParams.get(SearchParams.Connect);

  if (connectTo == null) {
    throw new Error(
      'No connect URL provided to useAuthenticateCliWithAccessToken',
    );
  }

  const createAccessTokenForCli = useMutation(createAccessTokenForCliMutation);

  const pingCli = useBasicMutation(
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
    isError: createAccessTokenForCli.isError || pingCli.isError,
    isSuccess: pingCli.isSuccess,
    async perform() {
      const tokenResult = await createAccessTokenForCli.mutateAsync({label});
      const pingResult = await pingCli.mutateAsync(tokenResult);
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
