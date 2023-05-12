import {Image as UiImage} from '@lemon/zest';
import {type ReactComponentPropsForClipsElement} from './shared.ts';

export function Image({
  source,
  sources,
  accessibilityRole,
  aspectRatio,
  description,
  fit,
  loading,
}: ReactComponentPropsForClipsElement<'ui-image'>) {
  return (
    <UiImage
      source={source}
      sources={sources}
      accessibilityRole={accessibilityRole}
      aspectRatio={aspectRatio}
      description={description}
      fit={fit}
      loading={loading}
    />
  );
}
