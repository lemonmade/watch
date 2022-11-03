import {useMemo} from 'react';
import {type Signal, signal} from '@quilted/quilt';
import {Action, BlockStack, Form, Select, Text, TextField} from '@lemon/zest';

import {useQuery, useMutation} from '~/shared/graphql';

import {type ClipsExtensionPointInstance} from '../extension';

import clipsExtensionSettingsQuery, {
  type ClipExtensionSettingsQueryData,
} from './graphql/ClipExtensionSettingsQuery.graphql';
import updateClipsExtensionSettingsMutation, {
  type UpdateClipsExtensionSettingsMutationData,
} from './graphql/UpdateClipsExtensionSettingsMutation.graphql';

export function ClipSettings({
  instance,
}: {
  instance: ClipsExtensionPointInstance<any>;
}) {
  const id = instance.context.extension.id;
  const {data, isFetching, refetch} = useQuery(clipsExtensionSettingsQuery, {
    variables: {id: instance.context.extension.id},
  });

  if (data?.clipsInstallation == null) {
    return (
      <Text>
        {isFetching ? 'Loading settings...' : 'Something went wrong!'}
      </Text>
    );
  }

  const {
    clipsInstallation: {
      settings,
      version: {translations, settings: schema},
    },
  } = data;

  return (
    <InstalledClipLoadedSettings
      id={id}
      settings={settings}
      translations={translations}
      schema={schema}
      onUpdate={async (_data) => {
        await refetch();
        // instance.context.settings.update(
        //   JSON.parse(
        //     data.updateClipsExtensionInstallation.installation?.settings ??
        //       '{}',
        //   ),
        // );
      }}
    />
  );
}

function InstalledClipLoadedSettings({
  id,
  translations,
  settings,
  schema,
  onUpdate,
}: Pick<
  ClipExtensionSettingsQueryData.ClipsInstallation.Version,
  'translations'
> &
  Pick<ClipExtensionSettingsQueryData.ClipsInstallation, 'id' | 'settings'> & {
    schema: ClipExtensionSettingsQueryData.ClipsInstallation.Version['settings'];
    onUpdate(data: UpdateClipsExtensionSettingsMutationData): Promise<void>;
  }) {
  const updateClipsExtensionSettings = useMutation(
    updateClipsExtensionSettingsMutation,
  );

  const settingsForm = useMemo(() => {
    const parsed = JSON.parse(settings ?? '{}');

    const settingsForm: Record<string, Signal<any>> = {};

    for (const field of schema.fields) {
      if (!('key' in field)) continue;
      settingsForm[field.key] = signal(parsed[field.key]);
    }

    return settingsForm;
  }, [settings, schema]);

  const translate = useTranslate(translations);

  const handleSubmit = async () => {
    const values: Record<string, any> = {};

    for (const [key, value] of Object.entries(settingsForm)) {
      values[key] = value.value;
    }

    const result = await updateClipsExtensionSettings.mutateAsync({
      id,
      settings: JSON.stringify(values),
    });

    await onUpdate(result);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <BlockStack spacing>
        {schema.fields.map((field) => {
          switch (field.__typename) {
            case 'ClipsExtensionSettingsStringField': {
              return (
                <TextField
                  key={field.key}
                  label={translate(field.label)}
                  value={settingsForm[field.key]}
                />
              );
            }
            case 'ClipsExtensionSettingsNumberField': {
              return (
                <TextField
                  key={field.key}
                  label={translate(field.label)}
                  value={settingsForm[field.key]}
                />
              );
            }
            case 'ClipsExtensionSettingsOptionsField': {
              return (
                <Select
                  key={field.key}
                  label={translate(field.label)}
                  options={field.options.map((option) => ({
                    value: option.value,
                    label: translate(option.label),
                  }))}
                  value={settingsForm[field.key]}
                />
              );
            }
          }

          throw new Error();
        })}
        <Action perform="submit">Update</Action>
      </BlockStack>
    </Form>
  );
}

function useTranslate(translations?: string | null) {
  return useMemo(() => {
    const parsedTranslations = JSON.parse(translations ?? '{}');

    return (
      field: ClipExtensionSettingsQueryData.ClipsInstallation.Version.Settings.Fields_ClipsExtensionSettingsStringField.Label,
    ) => {
      switch (field.__typename) {
        case 'ClipsExtensionSettingsStringStatic': {
          return field.value;
        }
        case 'ClipsExtensionSettingsStringTranslation': {
          const translated = parsedTranslations[field.key];
          if (translated == null) {
            throw new Error(`No translation found for ${field.key}`);
          }

          return translated;
        }
      }

      throw new Error(`Unknown type: ${field.__typename}`);
    };
  }, [translations]);
}
