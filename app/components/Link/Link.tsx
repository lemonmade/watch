import {ComponentProps} from 'react';
import {Link as RouterLink} from '@quilted/quilt';

export function Link({to, ...rest}: ComponentProps<typeof RouterLink>) {
  if (typeof to === 'string' && /^https?:\/\//.test(to)) {
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    return <a href={to} target="_blank" rel="noopener noreferrer" {...rest} />;
  }

  return <RouterLink to={to} {...rest} />;
}
