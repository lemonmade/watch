<script lang="ts">
  import {getApi} from '@watching/clips-svelte';
  import type {SeriesQueryData} from './SeriesQuery.graphql';

  const {target, query} = getApi<'series.details.accessory', SeriesQueryData>();
</script>

<ui-text-block>
  You are rendering in the <ui-text emphasis>{target}</ui-text>
  extension point, on a series named
  <ui-text emphasis>{$query.series.name}</ui-text>!
</ui-text-block>
