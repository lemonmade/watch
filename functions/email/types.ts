import type {ComponentProps} from 'react';

export interface EmailPropsMap {
  welcome: ComponentProps<typeof import('./emails/Welcome').Welcome>;
  signIn: ComponentProps<typeof import('./emails/SignIn').SignIn>;
}

export type EmailType = keyof EmailPropsMap;

export type PropsForEmail<T extends EmailType> = EmailPropsMap[T];
