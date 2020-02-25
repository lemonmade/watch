import {EnhancedURL, Match} from './types';

export const SERVER_RENDER_EFFECT_ID = Symbol('router');

export interface State {
  switchFallbacks: string[];
}

type Listener = (url: EnhancedURL) => void;

interface PrefetchRegistration {
  match: Match;
  render(url: URL): React.ReactNode;
}

type Search = string | object | URLSearchParams;

// should accept a function that resolves to one of these
export type NavigateTo =
  | string
  | URL
  | {
      pathname?: string;
      hash?: string;
      search?: Search;
    };

export type Blocker = (
  to: EnhancedURL,
  redo: () => void,
) => boolean | Promise<boolean>;

export interface NavigateOptions {
  replace?: boolean;
  state?: {[key: string]: unknown};
}

interface RemoteUrl {
  href: string;
  state?: NavigateOptions['state'];
}

type RemoteBlocker = (
  to: RemoteUrl,
  redo: () => void | Promise<void>,
) => boolean | Promise<boolean>;

type RemoteListener = (url: RemoteUrl) => void;

export interface RemoteRouter {
  initialUrl: RemoteUrl;
  go(count: number): void;
  navigate(to: RemoteUrl, options?: Omit<NavigateOptions, 'state'>): void;
  listen(listener: RemoteListener): void;
  unlisten(listener: RemoteListener): void;
  block(blocker: RemoteBlocker): void;
  unblock(blocker: RemoteBlocker): void;
}

export const LISTEN = Symbol('listen');
export const EXTRACT = Symbol('extract');
export const REGISTER = Symbol('register');
export const REGISTERED = Symbol('registered');
export const CREATE_SWITCH_ID = Symbol('createSwitchId');
export const MARK_SWITCH_FALLBACK = Symbol('markSwitchAsFallback');
export const SWITCH_IS_FALLBACK = Symbol('switchIsFallback');

// should move NoMatch stuff to its own controller
export class Router {
  currentUrl: EnhancedURL;

  readonly [REGISTERED] = new Set<PrefetchRegistration>();

  private readonly switchFallbacks = new Set<string>();
  private currentSwitchId = 0;
  private blockers = new Set<Blocker>();
  private listeners = new Set<Listener>();

  constructor(private readonly remote: RemoteRouter) {
    const currentUrl = enhancedUrlFromRemote(remote.initialUrl);
    this.currentUrl = currentUrl;

    remote.listen((url) => {
      this.currentUrl = enhancedUrlFromRemote(url);
      for (const listener of this.listeners) {
        listener(this.currentUrl);
      }
    });
  }

  navigate(to: NavigateTo, options?: NavigateOptions) {
    const key = createKey();
    const state = {...(options?.state ?? {}), key};

    this.remote.navigate(
      {href: resolveUrl(to, this.currentUrl).href, state},
      options,
    );
  }

  go(count: number) {
    this.remote.go(count);
  }

  back(count = -1) {
    this.go(count > 0 ? -count : count);
  }

  forward(count = 1) {
    this.go(count);
  }

  block(blocker: Blocker = () => true) {
    this.blockers.add(blocker);
    if (this.blockers.size === 1) this.remote.block(this.shouldBlock);

    return () => {
      this.blockers.delete(blocker);
      if (this.blockers.size === 0) this.remote.unblock(this.shouldBlock);
    };
  }

  resolve(to: NavigateTo, from = this.currentUrl) {
    return resolve(to, from);
  }

  resolveUrl(to: NavigateTo, from = this.currentUrl) {
    return resolveUrl(to, from);
  }

  // should make this a normal method
  [LISTEN](listener: Listener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  [SWITCH_IS_FALLBACK](id: string) {
    return this.switchFallbacks.has(id);
  }

  [MARK_SWITCH_FALLBACK](id: string) {
    this.switchFallbacks.add(id);
  }

  [CREATE_SWITCH_ID]() {
    return String(this.currentSwitchId++);
  }

  [REGISTER](registration: PrefetchRegistration) {
    this[REGISTERED].add(registration);

    return () => {
      this[REGISTERED].delete(registration);
    };
  }

  // should reverse the meaning of block => true
  private async shouldBlock(to: RemoteUrl, redo: () => void) {
    const url = enhancedUrlFromRemote(to);

    return (
      await Promise.all(
        [...this.blockers].map(async (blocker) => {
          const result = await blocker(url, redo);
          return !result;
        }),
      )
    ).some(Boolean);
  }
}

function enhanceUrl(url: URL, state: object = {}): EnhancedURL {
  Object.defineProperty(url, 'state', {
    value: state,
    writable: true,
  });

  return url as EnhancedURL;
}

function enhancedUrlFromRemote({href, state}: RemoteUrl) {
  return enhanceUrl(new URL(href), state);
}

function resolveUrl(to: NavigateTo, from: URL) {
  if (to instanceof URL) {
    if (to.origin !== from.origin) {
      throw new Error(
        `You can’t perform a client side navigation to ${to.href} from ${from.href}`,
      );
    }

    return to;
  } else if (typeof to === 'object') {
    const {pathname, search, hash} = to;

    // should make sure we insert the hash/ question mark
    const finalPathname = pathname || from.pathname;
    const finalSearch = searchToString(search || from.search);
    const finalHash = hash || from.hash;

    return new URL(`${finalPathname}${finalSearch}${finalHash}`, from.href);
  }

  return new URL(to, postfixSlash(from.href));
}

function resolve(to: NavigateTo, from: URL) {
  if (to instanceof URL) {
    if (to.origin !== from.origin) {
      throw new Error(
        `You can’t perform a client side navigation to ${to.href} from ${from.href}`,
      );
    }

    return urlToPath(to);
  } else if (typeof to === 'object') {
    const {pathname, search, hash} = to;

    const finalPathname = pathname || from.pathname;
    const finalSearch = searchToString(search || from.search);
    const finalHash = hash || from.hash;

    return `${finalPathname}${finalSearch}${finalHash}`;
  }

  return to.indexOf('/') === 0
    ? to
    : urlToPath(new URL(to, postfixSlash(from.href)));
}

function postfixSlash(path: string) {
  return path.lastIndexOf('/') === path.length - 1 ? path : `${path}/`;
}

function urlToPath(url: URL) {
  return `${url.pathname}${url.search}${url.hash}`;
}

function createKey() {
  return `${String(Date.now())}${Math.random()}`;
}

function searchToString(search?: Search) {
  if (search == null) {
    return '';
  } else if (typeof search === 'string') {
    return search;
  } else if (search instanceof URLSearchParams) {
    return search.toString();
  } else {
    return Object.keys(search).reduce<string>((searchString, key) => {
      return `${searchString}${key}=${encodeURIComponent(
        (search as any)[key],
      )}`;
    }, '?');
  }
}
