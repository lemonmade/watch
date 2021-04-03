import * as Cookies from 'cookie';

export interface RequestCookies {
  get(cookie: string): string | undefined;
}

export interface EnhancedURL extends URL {
  readonly normalizedPath: string;
}

export interface ExtendedRequestOptions {
  readonly url: URL | string;
  readonly body?: string | null;
  readonly method?: string;
  readonly cookies?: RequestCookies;
  readonly headers?: Headers;
}

export interface ExtendedRequest {
  readonly url: EnhancedURL;
  readonly body?: string | null;
  readonly method: string;
  readonly cookies: RequestCookies;
  readonly headers: Headers;
}

export interface CookieDefinition {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  sameSite?: 'lax' | 'strict' | 'none';
  secure?: boolean;
  httpOnly?: boolean;
}

export interface ResponseCookies {
  set(cookie: string, value: string, definition?: CookieDefinition): void;
  delete(cookie: string): void;
}

export interface ExtendedResponse extends Response {
  readonly cookies: ResponseCookies;
}

export interface ExtendedResponseInit extends ResponseInit {
  cookies?: Record<string, CookieDefinition>;
}

export type ValueOrPromise<T> = T | Promise<T>;

export interface RequestHandler {
  (request: ExtendedRequest): ValueOrPromise<
    Response | ExtendedResponse | undefined | null
  >;
}

export type RouteMatch = string | RegExp;

export type Prefix = string;

export interface App {
  any(handler: RequestHandler): void;
  any(match: RouteMatch, handler: RequestHandler): void;
  get(handler: RequestHandler): void;
  get(match: RouteMatch, handler: RequestHandler): void;
  post(handler: RequestHandler): void;
  post(match: RouteMatch, handler: RequestHandler): void;
  options(handler: RequestHandler): void;
  options(match: RouteMatch, handler: RequestHandler): void;
  run(request: ExtendedRequestOptions): Promise<ExtendedResponse>;
}

export interface AppOptions {
  readonly prefix?: Prefix;
}

interface RequestHandlerRegistration {
  readonly method?: 'GET' | 'POST' | 'OPTIONS';
  readonly handler: RequestHandler;
  readonly match: RouteMatch;
}

export function createApp({prefix}: AppOptions = {}): App {
  const registrations: RequestHandlerRegistration[] = [];

  return {
    any(...args: any[]) {
      const [match, handler] = normalizeRouteArguments(...args);
      registrations.push({match, handler});
    },
    get(...args: any[]) {
      const [match, handler] = normalizeRouteArguments(...args);
      registrations.push({method: 'GET', match, handler});
    },
    post(...args: any[]) {
      const [match, handler] = normalizeRouteArguments(...args);
      registrations.push({method: 'POST', match, handler});
    },
    options(...args: any[]) {
      const [match, handler] = normalizeRouteArguments(...args);
      registrations.push({method: 'OPTIONS', match, handler});
    },
    async run(requestOptions) {
      const request = createRequest(requestOptions, prefix);
      const {normalizedPath} = request.url;

      for (const {method, handler, match} of registrations) {
        if (method != null && method !== request.method) continue;
        if (typeof match === 'string') {
          if (match !== normalizedPath) continue;
        } else if (!match.test(normalizedPath)) continue;

        const response: Response | ExtendedResponse =
          (await handler(request)) ?? notFound();
        return 'cookies' in response ? response : augmentResponse(response);
      }

      return notFound();
    },
  };
}

function normalizeRouteArguments(...args: any[]): [RouteMatch, RequestHandler] {
  if (args[1]) {
    return args as [RouteMatch, RequestHandler];
  } else {
    return [/.*/, (args as [RequestHandler])[0]];
  }
}

function createRequest(
  {
    url,
    method = 'GET',
    body,
    headers = new Headers(),
    cookies = cookiesFromHeaders(headers),
  }: ExtendedRequestOptions,
  prefix?: Prefix,
): ExtendedRequest {
  return {
    url: enhanceUrl(url, prefix),
    body,
    method,
    cookies,
    headers,
  };
}

function enhanceUrl(urlOrString: string | URL, prefix?: Prefix): EnhancedURL {
  const url = new URL(
    typeof urlOrString === 'string' ? urlOrString : urlOrString.href,
  );

  url.pathname = normalizePath(url.pathname);

  let normalizedPath = url.pathname;

  if (prefix != null) {
    if (typeof prefix === 'string') {
      normalizedPath = normalizePath(normalizedPath.replace(prefix, ''));
    } else {
      normalizedPath = normalizePath(normalizedPath.replace(prefix, ''));
    }
  }

  Reflect.defineProperty(url, 'normalizedPath', {
    value: normalizedPath,
    writable: false,
  });

  return url as EnhancedURL;
}

function normalizePath(path: string) {
  if (path === '') return '/';
  if (path.endsWith('/')) return path.slice(0, -1);
  return path;
}

function cookiesFromHeaders(headers: Headers): ExtendedRequest['cookies'] {
  const cookies = Cookies.parse(headers.get('Cookie') ?? '');

  return {
    get: (key) => cookies[key],
  };
}

function augmentResponse(
  response: Response | ExtendedResponse,
): ExtendedResponse {
  if ('cookies' in response) return response;

  const serializedCookies = new Map<string, string>();

  const responseCookies: ResponseCookies = {
    set(cookie, value, options) {
      const setCookie = Cookies.serialize(cookie, value, options);
      serializedCookies.set(cookie, setCookie);

      response.headers.delete('Set-Cookie');

      for (const cookie of serializedCookies.values()) {
        response.headers.append('Set-Cookie', cookie);
      }
    },
    delete(cookie) {
      responseCookies.set(cookie, '', {expires: new Date(0)});
    },
  };

  Reflect.defineProperty(response, 'cookies', {
    value: responseCookies,
    writable: false,
  });

  return response as ExtendedResponse;
}

export function response(
  body?: BodyInit | null,
  {
    status = 200,
    statusText,
    headers: explicitHeaders,
    cookies: explicitCookies,
  }: ExtendedResponseInit = {},
): ExtendedResponse {
  const headers = normalizeHeaders(explicitHeaders);

  if (explicitCookies) {
    // eslint-disable-next-line no-warning-comments
    // TODO
  }

  const response = new Response(body, {status, statusText, headers});

  return augmentResponse(response);
}

export function notFound() {
  return response(null, {status: 404});
}

export function noContent({
  headers,
  cookies,
}: Pick<ExtendedResponseInit, 'headers' | 'cookies'>) {
  return response(null, {status: 204, headers, cookies});
}

export function redirect(
  location: string | URL,
  {
    status = 302,
    headers,
    cookies,
  }: Omit<ExtendedResponseInit, 'status' | 'statusText'> & {
    status?: 302 | 303;
  } = {},
): ExtendedResponse {
  const redirectResponse = response(null, {status, headers, cookies});
  redirectResponse.headers.set('Location', urlToString(location));
  return redirectResponse;
}

export function html(body: any, options?: ExtendedResponseInit) {
  const htmlResponse = response(body, options);
  htmlResponse.headers.set('Content-Type', 'text/html');
  return htmlResponse;
}

export function json(body: any, options?: ExtendedResponseInit) {
  const jsonResponse = response(JSON.stringify(body), options);
  jsonResponse.headers.set('Content-Type', 'application/json');
  return jsonResponse;
}

export async function fetchJson<T = unknown>(
  url: string | URL,
  body: any,
  {
    headers: explicitHeaders,
    ...options
  }: Omit<RequestInit, 'body' | 'method'> = {},
): Promise<T> {
  const headers = normalizeHeaders(explicitHeaders);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(urlToString(url), {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
    ...options,
  });

  const result = await response.json();

  return result as T;
}

function urlToString(urlOrString: string | URL) {
  return typeof urlOrString === 'string' ? urlOrString : urlOrString.href;
}

function normalizeHeaders(explicitHeaders?: Headers | HeadersInit) {
  return explicitHeaders instanceof Headers
    ? explicitHeaders
    : new Headers(explicitHeaders);
}
