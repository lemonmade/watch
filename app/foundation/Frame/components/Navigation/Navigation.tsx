import {type ReactNode, type PropsWithChildren, useMemo} from 'react';
import {useCurrentUrl, useRouter, type NavigateTo} from '@quilted/quilt';
import {classes} from '@lemon/css';
import {View, Pressable, Text} from '@lemon/zest';

import styles from './Navigation.module.css';

export interface NavigationProps {}

export function Navigation({children}: PropsWithChildren<NavigationProps>) {
  return <View padding="small">{children}</View>;
}

export interface NavigationItemProps {
  to: NavigateTo;
  icon: ReactNode;
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
    <Pressable
      to={to}
      display="grid"
      inlineAlignment="start"
      className={classes(styles.NavigationItem, selected && styles.selected)}
    >
      {icon}
      <Text>{children}</Text>
    </Pressable>
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
