import {describe} from '@quilted/testing';

import {EpisodeSelection} from '../episodes.ts';

describe('EpisodeSelection', () => {
  describe('nextEpisode', () => {
    it('returns the first episode of a season in range', () => {
      const episodes = new EpisodeSelection('S3');
      expect(episodes.nextEpisode('S3')).toStrictEqual({season: 3, episode: 1});
    });

    it('returns the next episode of a season in range', () => {
      const episodes = new EpisodeSelection('S3');
      expect(episodes.nextEpisode('S3E1')).toStrictEqual({
        season: 3,
        episode: 2,
      });
    });

    it('returns the first episode of the first later season for a season not in range', () => {
      const episodes = new EpisodeSelection('S1', 'S5', 'S4');
      expect(episodes.nextEpisode('S3')).toStrictEqual({
        season: 4,
        episode: 1,
      });
    });

    it('skips holes in episode ranges', () => {
      const episodes = new EpisodeSelection('S1-S1E3', 'S1E5', 'S2');
      expect(episodes.nextEpisode('S1E2')).toStrictEqual({
        season: 1,
        episode: 3,
      });
      expect(episodes.nextEpisode('S1E3')).toStrictEqual({
        season: 1,
        episode: 5,
      });
      expect(episodes.nextEpisode('S1E5')).toStrictEqual({
        season: 2,
        episode: 1,
      });
    });

    it('returns undefined when the episode is past the last range', () => {
      const episodes = new EpisodeSelection('S1');
      expect(episodes.nextEpisode('S3')).toBeUndefined();
    });
  });
});
