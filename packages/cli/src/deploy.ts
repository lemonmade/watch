import {loadApp} from './shared';

export async function deploy() {
  const app = await loadApp();
  // eslint-disable-next-line no-console
  console.log(app);
}
