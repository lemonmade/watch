import jwt, {
  type JwtSignOptions,
  type JwtVerifyOptions,
} from '@tsndr/cloudflare-worker-jwt';

export async function decodeSignedToken<
  T = Record<string, unknown>,
  H = unknown,
>(token: string): Promise<Pick<SignedTokenResult<T, H>, 'data' | 'header'>> {
  const result = jwt.decode(token);
  return {data: result.payload as T, header: result.header as H};
}

export async function createSignedToken(
  data: Record<string, any>,
  {
    secret,
    expiresIn,
    ...options
  }: JwtSignOptions<unknown> & {secret: string; expiresIn: number},
) {
  const token = await jwt.sign(
    expiresIn ? {...data, exp: Date.now() + expiresIn} : data,
    secret,
    options,
  );
  return token;
}

interface SignedTokenResult<T, H = unknown> {
  data: T;
  header: H;
  subject?: string;
  expired: boolean;
  expiresAt?: Date;
}

export async function verifySignedToken<
  T = Record<string, unknown>,
  H = unknown,
>(
  token: string,
  {secret, ...options}: JwtVerifyOptions & {secret: string},
): Promise<SignedTokenResult<T, H>> {
  const verified = await jwt.verify(token, secret, options);
  const {exp, sub, ...data} = verified!.payload as any;

  const expiresAt = exp ? new Date(exp * 1_000) : undefined;
  const expired = expiresAt != null && expiresAt.getTime() < Date.now();

  return {
    data: data as T,
    header: verified?.header as H,
    subject: sub || undefined,
    expired,
    expiresAt,
  };
}
