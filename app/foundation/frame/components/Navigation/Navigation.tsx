import type {ComponentProps, RenderableProps} from 'preact';
import {useMemo} from 'preact/hooks';
import {
  useCurrentURL,
  useRouter,
  type NavigateTo,
} from '@quilted/quilt/navigation';
import {View, Button, Icon} from '@lemon/zest';

import styles from './Navigation.module.css';

export interface NavigationProps {}

export function Navigation({children}: RenderableProps<NavigationProps>) {
  return <View className={styles.Navigation}>{children}</View>;
}

export interface NavigationItemProps {
  to: NavigateTo;
  icon: ComponentProps<typeof Icon>['source'];
  matches?: (string | RegExp)[];
  emphasis?: ComponentProps<typeof Button>['emphasis'];
}

export function NavigationItem({
  to,
  icon,
  matches,
  emphasis,
  children,
}: RenderableProps<NavigationItemProps>) {
  const selected = useItemSelected(to, matches);

  return (
    <Button
      selected={selected}
      to={to}
      inlineAlignment="start"
      inlineSize="fill"
      icon={icon}
      emphasis={emphasis}
    >
      {children}
    </Button>
  );
}

function useItemSelected(
  to: NavigationItemProps['to'],
  matches?: NavigationItemProps['matches'],
) {
  const router = useRouter();
  const {pathname} = useCurrentURL();

  return useMemo(() => {
    const checkMatches = matches ?? [router.resolve(to).url.pathname];

    return checkMatches.some((match) => {
      if (typeof match === 'string') {
        return match === pathname || pathname.startsWith(`${match}/`);
      } else {
        return match.test(pathname);
      }
    });
  }, [router, matches, to, pathname]);
}
