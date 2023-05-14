import {Image as UiImage} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const Image = createClipsComponent(
  'ui-image',
  function Image({
    source,
    sources,
    accessibilityRole,
    aspectRatio,
    description,
    fit,
    loading,
  }) {
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
  },
);
