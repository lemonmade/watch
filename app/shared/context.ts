import {createOptionalContext} from '@quilted/quilt/context';
import {type QueryClient} from '@tanstack/react-query';
import {type Router} from '@quilted/quilt/navigation';
import {type Performance} from '@quilted/quilt/performance';

export interface AppContext {
  readonly queryClient: QueryClient;
  readonly router: Router;
  readonly performance?: Performance;
}

export const AppContextReact = createOptionalContext<AppContext>();
export const useAppContext = AppContextReact.use;
