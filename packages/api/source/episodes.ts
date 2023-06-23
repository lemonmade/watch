import type {
  SeasonSelector,
  EpisodeSelector,
  EpisodeRangeSelector,
  EpisodeEndpointSelector,
  EpisodeSelectorObject,
  EpisodeRangeSelectorObject,
  EpisodeEndpointSelectorObject,
} from './types.ts';

const EPISODE_SELECTOR_REGEX =
  /s0*(\d+)(?:e0*(\d+))?(?:-s0*(\d+)(?:e0*(\d+))?)?/i;

export class EpisodeSelection {
  static parse = parse;
  static stringify = stringify;

  static from(...selectors: Parameters<EpisodeSelection['add']>) {
    return new EpisodeSelection(...selectors);
  }

  private readonly includedRanges: EpisodeRange[] = [];

  constructor(...selectors: Parameters<EpisodeSelection['add']>) {
    this.add(...selectors);
  }

  add(
    ...selectors: (
      | ConstructorParameters<typeof EpisodeRange>[0]
      | {seasons: number[]}
      | {season: number; episodes: number[]}
    )[]
  ) {
    const newSelectors = selectors.flatMap<EpisodeRange>((selector) => {
      if (typeof selector === 'string') {
        return new EpisodeRange(selector);
      }

      if ('seasons' in selector) {
        return selector.seasons.map((season) => new EpisodeRange({season}));
      }

      if ('episodes' in selector) {
        const {season, episodes} = selector;
        return episodes.map((episode) => new EpisodeRange({season, episode}));
      }

      return new EpisodeRange(selector);
    });

    mergeRanges(this.includedRanges, newSelectors);

    return this;
  }

  ranges() {
    return [...this.includedRanges];
  }

  selectors() {
    return this.includedRanges.map((range) =>
      episodeRangeObjectToSelector(range),
    );
  }

  includes(...args: Parameters<EpisodeRange['includes']>) {
    return this.includedRanges.some((range) => range.includes(...args));
  }

  nextEpisode(
    current: EpisodeSelector | SeasonSelector | EpisodeEndpointSelectorObject,
  ): EpisodeSelectorObject | undefined {
    const {episode, season} =
      typeof current === 'string' ? parse(current) : current;

    for (const range of this.includedRanges) {
      const [fromSeason, fromEpisode, toSeason, toEpisode] =
        rangeToEdges(range);

      const nextEpisode = episode ? episode + 1 : 1;

      if (
        fromSeason > season ||
        (fromSeason === season && fromEpisode >= nextEpisode)
      ) {
        return {season: fromSeason, episode: fromEpisode};
      }

      if (
        toSeason < season ||
        (toSeason === season && toEpisode < nextEpisode)
      ) {
        continue;
      }

      return {season, episode: nextEpisode};
    }
  }

  toString() {
    return this.selectors().join(',');
  }
}

export class EpisodeRange implements EpisodeRangeSelectorObject {
  from?: EpisodeEndpointSelectorObject;
  to?: EpisodeEndpointSelectorObject;

  constructor(
    range:
      | EpisodeEndpointSelector
      | EpisodeEndpointSelectorObject
      | EpisodeRangeSelector
      | {
          season?: never;
          episode?: never;
          from?: EpisodeEndpointSelector | EpisodeEndpointSelectorObject;
          to?: EpisodeEndpointSelector | EpisodeEndpointSelectorObject;
        },
  ) {
    if (typeof range === 'string') {
      const parsed = parse(range);
      Object.assign(
        this,
        'from' in parsed ? parsed : {from: parsed, to: parsed},
      );
    } else if (range.season != null) {
      if (range.episode != null) {
        const endpoint: EpisodeEndpointSelectorObject = {
          season: range.season,
          episode: range.episode,
        };

        Object.assign(this, {from: endpoint, to: endpoint});
      } else {
        const endpoint: EpisodeEndpointSelectorObject = {season: range.season};
        Object.assign(this, {from: endpoint, to: endpoint});
      }
    } else {
      const {from, to} = range;

      Object.assign(this, {
        from: typeof from === 'string' ? parse(from) : from,
        to: typeof to === 'string' ? parse(to) : to,
      });
    }
  }

  includes(
    selector:
      | EpisodeEndpointSelector
      | EpisodeEndpointSelectorObject
      | EpisodeRangeSelector
      | EpisodeEndpointSelectorObject,
  ): boolean {
    const parsedSelector =
      typeof selector === 'string' ? parse(selector) : selector;

    if ('season' in parsedSelector) {
      return (
        endpointIsAfterRangeStart(parsedSelector, this) &&
        endpointIsBeforeRangeEnd(parsedSelector, this)
      );
    } else {
      const {from, to} = parsedSelector;

      if (from == null && !endpointIsAfterRangeStart({season: 1}, this)) {
        return false;
      }

      if (to == null && this.to != null) {
        return false;
      }

      return (
        (from == null || endpointIsAfterRangeStart(from, this)) &&
        (to == null || endpointIsBeforeRangeEnd(to, this))
      );
    }
  }
}

function endpointIsAfterRangeStart(
  {season, episode}: EpisodeEndpointSelectorObject,
  {from}: EpisodeRangeSelectorObject,
) {
  if (from == null) return true;
  if (from.season > season) return false;
  return episode == null || from.episode == null || from.episode <= episode;
}

function endpointIsBeforeRangeEnd(
  {season, episode}: EpisodeEndpointSelectorObject,
  {to}: EpisodeRangeSelectorObject,
) {
  if (to == null) return true;
  if (to.season < season) return false;
  return episode == null || to.episode == null || to.episode >= episode;
}

function mergeRanges(current: EpisodeRange[], merge: EpisodeRange[]) {
  const sorted = merge.sort((a, b) => {
    const [aFromSeason, aFromEpisode, aToSeason, aToEpisode] = rangeToEdges(a);
    const [bFromSeason, bFromEpisode, bToSeason, bToEpisode] = rangeToEdges(b);

    if (aFromSeason !== bFromSeason) {
      return aFromSeason - bFromSeason;
    }

    if (aFromEpisode !== bFromEpisode) {
      return aFromEpisode - bFromEpisode;
    }

    if (aToSeason !== bToSeason) {
      return aToSeason - bToSeason;
    }

    return aToEpisode - bToEpisode;
  });

  let currentIndex = 0;
  let currentRange = current[currentIndex];

  sorted.forEach((range) => {
    const [rangeFromSeason, rangeFromEpisode, rangeToSeason, rangeToEpisode] =
      rangeToEdges(range);

    while (currentRange) {
      const [
        currentRangeFromSeason,
        currentRangeFromEpisode,
        currentRangeToSeason,
        currentRangeToEpisode,
      ] = rangeToEdges(currentRange);

      const endsBefore =
        rangeToSeason < currentRangeFromSeason ||
        (rangeToSeason === currentRangeFromSeason &&
          rangeToEpisode < currentRangeFromEpisode - 1);

      if (endsBefore) {
        current.splice(currentIndex, 0, range);
        currentRange = range;
        return;
      }

      const startsBefore =
        rangeFromSeason <= currentRangeFromSeason &&
        rangeFromEpisode < currentRangeFromEpisode;

      const endsAfter =
        rangeToSeason > currentRangeToSeason ||
        (rangeToSeason === currentRangeToSeason &&
          rangeToEpisode > currentRangeToEpisode);

      if (startsBefore) {
        currentRange.from = range.from;
        if (endsAfter) currentRange.to = range.to;
        return;
      }

      const startsDuring =
        rangeFromSeason < currentRangeToSeason ||
        (rangeFromSeason === currentRangeToSeason &&
          rangeFromEpisode <= currentRangeToEpisode) ||
        (rangeFromSeason === currentRangeToSeason + 1 &&
          rangeFromEpisode === 1 &&
          currentRange.to?.episode == null);

      if (startsDuring) {
        if (endsAfter) currentRange.to = range.to;
        return;
      }

      currentIndex++;
      currentRange = current[currentIndex];
    }

    current.push(range);
    currentRange = range;
    currentIndex = current.length - 1;
  });
}

function rangeToEdges({
  from,
  to,
}: EpisodeRange): [
  fromSeason: number,
  fromEpisode: number,
  toSeason: number,
  toEpisode: number,
] {
  return [
    from?.season ?? 1,
    from?.episode ?? 1,
    to?.season ?? 10_000,
    to?.episode ?? 10_000,
  ];
}

function episodeRangeObjectToSelector({
  from,
  to,
}: EpisodeRangeSelectorObject):
  | SeasonSelector
  | EpisodeSelector
  | EpisodeRangeSelector {
  const fromSelector = from && episodeEndpointObjectToSelector(from, true);
  const toSelector = to && episodeEndpointObjectToSelector(to, false);
  return fromSelector != null && fromSelector === toSelector
    ? fromSelector
    : `${fromSelector ?? ''}-${toSelector ?? ''}`;
}

function episodeEndpointObjectToSelector(
  {season, episode}: EpisodeEndpointSelectorObject,
  from = false,
): EpisodeEndpointSelector {
  return episode == null || (from && episode === 1)
    ? `S${season}`
    : `S${season}E${episode}`;
}

function stringify<
  SelectorObject extends
    | EpisodeSelectorObject
    | EpisodeEndpointSelectorObject
    | EpisodeRangeSelectorObject,
>(
  selector: SelectorObject,
): SelectorObject extends EpisodeRangeSelectorObject
  ? EpisodeRangeSelector
  : SelectorObject extends EpisodeSelectorObject
  ? EpisodeSelector
  : EpisodeEndpointSelector {
  if ('season' in selector) {
    const {season, episode} = selector;
    return (episode == null ? `S${season}` : `S${season}E${episode}`) as any;
  }

  const {from, to} = selector;
  return `${from ? stringify(from) : ''}-${to ? stringify(to) : ''}` as any;
}

function parse<
  Selector extends
    | EpisodeSelector
    | EpisodeEndpointSelector
    | EpisodeRangeSelector,
>(
  selector: Selector,
): Selector extends EpisodeRangeSelector
  ? EpisodeRangeSelectorObject
  : Selector extends EpisodeSelector
  ? EpisodeSelectorObject
  : EpisodeEndpointSelectorObject {
  const matched = selector.match(EPISODE_SELECTOR_REGEX);

  if (matched == null || !matched[1]) {
    throw new Error(`Unable to parse episode selector: "${selector}"`);
  }

  const [
    ,
    fromSeasonMatch,
    fromEpisodeMatch,
    rangeSeparator,
    toSeasonMatch,
    toEpisodeMatch,
  ] = matched;

  const fromSeason = fromSeasonMatch
    ? Number.parseInt(fromSeasonMatch, 10)
    : undefined;
  const fromEpisode = fromEpisodeMatch
    ? Number.parseInt(fromEpisodeMatch, 10)
    : undefined;
  const toSeason = toSeasonMatch
    ? Number.parseInt(toSeasonMatch, 10)
    : undefined;
  const toEpisode = toEpisodeMatch
    ? Number.parseInt(toEpisodeMatch, 10)
    : undefined;

  const from =
    fromEpisode == null
      ? {season: fromSeason!}
      : {season: fromSeason!, episode: fromEpisode};

  if (!rangeSeparator) {
    return from as any;
  }

  const to =
    toSeason == null
      ? undefined
      : toEpisode == null
      ? {season: toSeason}
      : {season: toSeason, episode: toEpisode};

  const range: EpisodeRangeSelectorObject = {};
  if (from) range.from = from;
  if (to) range.to = to;

  return range as any;
}
