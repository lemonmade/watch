import {redirect} from '@lemon/tiny-server';
import type {ExtendedRequest} from '@lemon/tiny-server';

import {SearchParam} from '../../constants';

export function signInFromEmail(request: ExtendedRequest) {
  const token = request.url.searchParams.get(SearchParam.Token);

  // eslint-disable-next-line no-console
  console.log({token});

  return redirect('/app');
}

export function signUpFromEmail(request: ExtendedRequest) {
  const token = request.url.searchParams.get(SearchParam.Token);

  // eslint-disable-next-line no-console
  console.log({token});

  return redirect('/app');
}
