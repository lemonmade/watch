import {ComponentProps} from 'react';
import {createRemoteReactComponent} from '@remote-ui/react';

interface Props extends ComponentProps<typeof import('@quilted/quilt').Link> {}

export const Link = createRemoteReactComponent<'Link', Props>('Link');
