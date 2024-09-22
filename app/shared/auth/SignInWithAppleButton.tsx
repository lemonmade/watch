import type {RenderableProps} from 'preact';
import {Button} from '@lemon/zest';

export interface SignInWithAppleResponse {
  idToken: string;
  authorizationCode: string;
}

export interface SignInWithAppleButtonProps {
  redirectUrl: URL | string;
  onPress(response: SignInWithAppleResponse): void | Promise<void>;
}

export function SignInWithAppleButton({
  children,
  redirectUrl,
  onPress,
}: RenderableProps<SignInWithAppleButtonProps>) {
  return (
    <Button
      onPress={async () => {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.onload = resolve;
          script.onerror = reject;
          script.src =
            'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
          document.head.appendChild(script);
        });

        const AppleID = (window as any).AppleID as any;

        AppleID.auth.init({
          clientId: 'tools.lemon.watch-web',
          redirectURI: redirectUrl.toString(),
          scope: 'email',
          usePopup: true,
        });

        const response = await AppleID.auth.signIn();

        await onPress({
          idToken: response.authorization.id_token,
          authorizationCode: response.authorization.code,
        });
      }}
    >
      {children}
    </Button>
  );
}
