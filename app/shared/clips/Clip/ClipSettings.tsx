import {useMemo} from 'preact/hooks';
import {signal, type Signal} from '@quilted/quilt/signals';
import {createTranslate} from '@quilted/localize';
import {Button, BlockStack, Form, Select, Text, TextField} from '@lemon/zest';

import {useGraphQLQuery, useGraphQLMutation} from '~/shared/graphql';

import {useClipsExtensionPointBeingRendered} from '../context.ts';

import clipsExtensionSettingsQuery, {
  type ClipExtensionSettingsQueryData,
} from './graphql/ClipExtensionSettingsQuery.graphql';
import updateClipsExtensionSettingsMutation, {
  type UpdateClipsExtensionSettingsMutationData,
} from './graphql/UpdateClipsExtensionSettingsMutation.graphql';

export function ClipSettings() {
  const extensionPoint = useClipsExtensionPointBeingRendered();

  const query = useGraphQLQuery(clipsExtensionSettingsQuery, {
    variables: {id: extensionPoint.installation.id},
    suspend: false,
  });

  const {value, isRunning} = query;

  if (value?.data?.clipsInstallation == null) {
    return (
      <Text>{isRunning ? 'Loading settings...' : 'Something went wrong!'}</Text>
    );
  }

  const {
    clipsInstallation: {
      settings,
      version: {translations, settings: schema},
    },
  } = value.data;

  return (
    <InstalledClipLoadedSettings
      settings={settings}
      translations={translations}
      schema={schema}
      onUpdate={async (data) => {
        extensionPoint.installed!.renderer.instance!.context.settings.value =
          JSON.parse(
            data.updateClipsExtensionInstallation.installation?.settings ??
              '{}',
          );
        await query.rerun();
      }}
    />
  );
}

function InstalledClipLoadedSettings({
  translations,
  settings,
  schema,
  onUpdate,
}: Pick<
  ClipExtensionSettingsQueryData.ClipsInstallation.Version,
  'translations'
> &
  Pick<ClipExtensionSettingsQueryData.ClipsInstallation, 'settings'> & {
    schema: ClipExtensionSettingsQueryData.ClipsInstallation.Version['settings'];
    onUpdate(data: UpdateClipsExtensionSettingsMutationData): Promise<void>;
  }) {
  const extensionPoint = useClipsExtensionPointBeingRendered();

  const updateClipsExtensionSettings = useGraphQLMutation(
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

    const result = await updateClipsExtensionSettings.run({
      id: extensionPoint.installation.id,
      settings: JSON.stringify(values),
    });

    if (result.data == null) {
      throw new Error('Failed to update settings');
    }

    await onUpdate(result.data);
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
        <Button perform="submit">Update</Button>
      </BlockStack>
    </Form>
  );
}

function useTranslate(translations?: string | null) {
  return useMemo(() => {
    const translate = createTranslate('en', JSON.parse(translations ?? '{}'));

    return (
      field: ClipExtensionSettingsQueryData.ClipsInstallation.Version.Settings.Fields_ClipsExtensionSettingsStringField.Label,
    ) => {
      switch (field.__typename) {
        case 'ClipsExtensionSettingsStringStatic': {
          return field.value;
        }
        case 'ClipsExtensionSettingsStringTranslation': {
          return translate(field.key);
        }
      }

      // @ts-expect-error
      throw new Error(`Unknown type: ${field.__typename}`);
    };
  }, [translations]);
}
