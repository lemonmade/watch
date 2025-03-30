declare module './context.ts' {
  interface AppContext {
    readonly environment: Environment;
  }
}

export interface Environment {
  readonly isPreview: boolean;
  readonly preview?: EnvironmentPreview;
  readonly debug: EnvironmentDebug;
}

export interface EnvironmentPreview {
  readonly commit: string;
}

export interface EnvironmentDebug {
  readonly flags: EnvironmentDebugFlags;
}

export interface EnvironmentDebugFlags {
  readonly logLevel: 'verbose' | 'auto';
}
