import {useMemo, type ComponentProps, type PropsWithChildren} from 'react';
import {useCurrentUrl, useRouter, type NavigateTo} from '@quilted/quilt';
import {View, Action, Icon} from '@lemon/zest';

import styles from './Navigation.module.css';

export interface NavigationProps {}

export function Navigation({children}: PropsWithChildren<NavigationProps>) {
  return <View className={styles.Navigation}>{children}</View>;
}

export interface NavigationItemProps {
  to: NavigateTo;
  icon: ComponentProps<typeof Icon>['source'];
  matches?: (string | RegExp)[];
}

export function NavigationItem({
  to,
  icon,
  matches,
  children,
}: PropsWithChildren<NavigationItemProps>) {
  const selected = useItemSelected(to, matches);

  return (
    <Action
      selected={selected}
      to={to}
      inlineAlignment="start"
      inlineSize="fill"
      icon={icon}
    >
      {children}
    </Action>
  );
}

function useItemSelected(
  to: NavigationItemProps['to'],
  matches?: NavigationItemProps['matches'],
) {
  const router = useRouter();
  const {pathname} = useCurrentUrl();

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
