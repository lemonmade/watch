import {Action} from '@lemon/zest';
import {type RenderableProps} from 'preact';

export interface SignInWithActionResponse {
  idToken: string;
  authorizationCode: string;
}

export interface SignInWithAppleActionProps {
  redirectUrl: URL | string;
  onPress(response: SignInWithActionResponse): void | Promise<void>;
}

export function SignInWithAppleAction({
  children,
  redirectUrl,
  onPress,
}: RenderableProps<SignInWithAppleActionProps>) {
  return (
    <Action
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
    </Action>
  );
}
