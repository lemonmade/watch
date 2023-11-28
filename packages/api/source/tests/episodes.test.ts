import {it, expect, describe} from 'vitest';

import {EpisodeSelection} from '../episodes.ts';

describe('EpisodeSelection', () => {
  describe('ranges', () => {
    it('preserves separate, isolated ranges', () => {
      const selection = new EpisodeSelection('S1', 'S3');
      expect(selection.selectors()).toStrictEqual(['S1', 'S3']);
    });

    it('merges overlapping ranges', () => {
      const selectionOne = new EpisodeSelection('S1', 'S1E1-S1E3');
      expect(selectionOne.selectors()).toStrictEqual(['S1']);

      const selectionTwo = new EpisodeSelection('S1E1-S1E3', 'S1');
      expect(selectionTwo.selectors()).toStrictEqual(['S1']);
    });

    it('extends previously-defined ranges to a later episode endpoint', () => {
      const selection = new EpisodeSelection('S1', 'S1E5-S3');
      expect(selection.selectors()).toStrictEqual(['S1-S3']);
    });

    it('extends previously-defined ranges to an earlier episode endpoint', () => {
      const selection = new EpisodeSelection('S2', 'S1-S2E5');
      expect(selection.selectors()).toStrictEqual(['S1-S2']);
    });

    it('merges directly adjacent ranges', () => {
      const selectionTwo = new EpisodeSelection('S2', 'S1', 'S3E3', 'S3E2');
      expect(selectionTwo.selectors()).toStrictEqual(['S1-S2', 'S3E2-S3E3']);

      const selectionOne = new EpisodeSelection('S1', 'S2', 'S3E2', 'S3E3');
      expect(selectionOne.selectors()).toStrictEqual(['S1-S2', 'S3E2-S3E3']);
    });
  });

  describe('nextEpisode()', () => {
    it('returns the first episode of a season in range', () => {
      const selection = new EpisodeSelection('S3');
      expect(selection.nextEpisode('S3')).toStrictEqual({
        season: 3,
        episode: 1,
      });
    });

    it('returns the next episode of a season in range', () => {
      const selection = new EpisodeSelection('S3');
      expect(selection.nextEpisode('S3E1')).toStrictEqual({
        season: 3,
        episode: 2,
      });
    });

    it('returns the first episode of the first later season for a season not in range', () => {
      const selection = new EpisodeSelection('S1', 'S5', 'S4');
      expect(selection.nextEpisode('S3')).toStrictEqual({
        season: 4,
        episode: 1,
      });
    });

    it('skips holes in episode ranges', () => {
      const selection = new EpisodeSelection('S1-S1E3', 'S1E5', 'S2');
      expect(selection.nextEpisode('S1E2')).toStrictEqual({
        season: 1,
        episode: 3,
      });
      expect(selection.nextEpisode('S1E3')).toStrictEqual({
        season: 1,
        episode: 5,
      });
      expect(selection.nextEpisode('S1E5')).toStrictEqual({
        season: 2,
        episode: 1,
      });
    });

    it('returns undefined when the episode is past the last range', () => {
      const selection = new EpisodeSelection('S1');
      expect(selection.nextEpisode('S3')).toBeUndefined();
    });
  });
});
