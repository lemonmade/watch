<script lang="ts">
  import {getApi} from '@watching/clips-svelte';
  import type {WatchThroughQueryData} from './WatchThroughQuery.graphql';

  const {target, query} = getApi<
    'watch-through.details.accessory',
    WatchThroughQueryData
  >();
</script>

<ui-block-stack spacing>
  <ui-text-block>
    You are rendering in the <ui-text emphasis>{target}</ui-text>
    extension point, on a series named
    <ui-text emphasis>{$query.watchThrough.series.name}</ui-text>!
  </ui-text-block>

  {#if $query.watchThrough.currentWatch != null}
    {#if $query.watchThrough.currentWatch.rating == null}
      <ui-text-block>You haven’t rated this episode yet.</ui-text-block>
    {:else}
      <ui-text-block>
        You’ve rated this episode <ui-text emphasis
          >{$query.watchThrough.currentWatch.rating}</ui-text
        >.
      </ui-text-block>
    {/if}
  {/if}
</ui-block-stack>
