import type {Configuration} from '@quilted/craft/graphql';

const config: Configuration = {
  projects: {
    default: {
      schema: 'graphql/main/*schema.graphql',
      documents: [
        'app/**/*.graphql',
        'packages/cli/source/commands/publish/**/*.graphql',
        'packages/cli/source/commands/push/**/*.graphql',
        'packages/cli/source/utilities/app/**/*.graphql',
        'packages/cli/source/utilities/authentication/**/*.graphql',
      ],
      exclude: [
        'app/shared/clips/Clip/graphql/LocalClipQuery.graphql',
        'app/shared/clips/graphql/LocalClipsExtensionsQuery.graphql',
        'app/shared/clips/graphql/LocalClipQuery.graphql',
        'app/features/Developer/Console/graphql/DeveloperConsoleQuery.graphql',
        'app/server/**/*.graphql',
        '**/*.schema.graphql',
      ],
      extensions: {
        quilt: {
          schema: [
            {
              kind: 'definitions',
              outputPath: 'app/server/graphql/schema.ts',
            },
            {kind: 'inputTypes', outputPath: 'app/graphql/types.d.ts'},
          ],
        },
      },
    },
    cli: {
      schema: 'packages/cli/source/commands/develop/schema.graphql',
      documents: [
        'app/shared/clips/Clip/graphql/LocalClipQuery.graphql',
        'app/shared/clips/graphql/LocalClipQuery.graphql',
        'app/shared/clips/graphql/LocalClipsExtensionsQuery.graphql',
        'app/features/Developer/Console/graphql/DeveloperConsoleQuery.graphql',
      ],
      extensions: {
        quilt: {
          schema: [
            {
              kind: 'definitions',
              outputPath: 'packages/cli/source/commands/develop/schema.ts',
            },
            {kind: 'inputTypes', outputPath: 'app/graphql/types/cli.d.ts'},
          ],
        },
      },
    },
    clipsShared: {
      schema: 'graphql/clips/Shared.schema.graphql',
      extensions: {
        quilt: {
          schema: [
            {
              kind: 'definitions',
              outputPath: 'packages/clips/source/graphql/Shared.ts',
            },
            {
              kind: 'graphql',
              outputPath: 'packages/cli/graphql/Shared.schema.graphql',
            },
          ],
        },
      },
    },
    clipsSeriesDetails: {
      schema: 'graphql/clips/SeriesDetails.schema.graphql',
      documents: ['packages/cli/templates/SeriesAccessory/**/*.graphql'],
      extensions: {
        quilt: {
          schema: [
            {
              kind: 'definitions',
              outputPath: 'packages/clips/source/graphql/SeriesDetails.ts',
            },
            {
              kind: 'graphql',
              outputPath: 'packages/cli/graphql/SeriesDetails.schema.graphql',
            },
          ],
        },
      },
    },
    clipsWatchThroughDetails: {
      schema: 'graphql/clips/WatchThroughDetails.schema.graphql',
      documents: ['packages/cli/templates/WatchThroughAccessory/**/*.graphql'],
      extensions: {
        quilt: {
          schema: [
            {
              kind: 'definitions',
              outputPath:
                'packages/clips/source/graphql/WatchThroughDetails.ts',
            },
            {
              kind: 'graphql',
              outputPath:
                'packages/cli/graphql/WatchThroughDetails.schema.graphql',
            },
          ],
        },
      },
    },
    github: {
      schema: 'graphql/github/schema.graphql',
      documents: 'app/server/auth/github/**/*.graphql',
      extensions: {
        quilt: {
          schema: [
            {
              kind: 'inputTypes',
              outputPath: 'app/server/auth/github/graphql/schema.d.ts',
            },
          ],
        },
      },
    },
  },
};

export default config;
