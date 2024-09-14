import {
  ClipsElement,
  backedByAttribute,
} from '../ClipsElement.ts';

export interface SkeletonTextBlockAttributes {
  /**
   * The number of lines to display in the skeleton text block.
   */
  lines?: string;
}

export interface SkeletonTextBlockProperties {
  /**
   * The number of lines to display in the skeleton text block.
   *
   * @default 1
   */
  lines: number;
}

export interface SkeletonTextBlockEvents {}

/**
 * SkeletonTextBlock is used to display a placeholder for a block of text content.
 */
export class SkeletonTextBlock
  extends ClipsElement<SkeletonTextBlockAttributes, SkeletonTextBlockEvents>
  implements SkeletonTextBlockProperties
{
  static get remoteAttributes() {
    return ['lines'] satisfies (keyof SkeletonTextBlockAttributes)[];
  }

  @backedByAttribute({
    parse(value) {
      return value ? Number(value) : undefined;
    },
    serialize(value) {
      return value?.toString();
    },
  })
  accessor lines: number = 3;
}

customElements.define('ui-skeleton-text-block', SkeletonTextBlock);

declare global {
  interface HTMLElementTagNameMap {
    'ui-skeleton-text-block': InstanceType<typeof SkeletonTextBlock>;
  }
}