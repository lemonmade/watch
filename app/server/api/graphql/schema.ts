export interface Query {
  __typename: "Query";
  apps(variables: Record<string, never>): App[];
  app(variables: {
    readonly id: string;
  }): App | null;
  clipsInstallation(variables: {
    readonly id: string;
  }): ClipsExtensionInstallation | null;
  clipsInstallations(variables: {
    readonly extensionPoint?: ClipsExtensionPoint | null;
    readonly conditions?: ClipsExtensionPointConditionMatchInput[] | null;
  }): ClipsExtensionInstallation[];
  me(variables: Record<string, never>): User;
  my(variables: Record<string, never>): User;
  lists(variables: Record<string, never>): List[];
  list(variables: {
    readonly id: string;
  }): List | null;
  series(variables: {
    readonly id: string;
  }): Series | null;
  version(variables: Record<string, never>): ApiVersion | null;
  search(variables: {
    readonly query: string;
  }): SearchResults;
  subscription(variables: {
    readonly id: string;
  }): SeriesSubscription | null;
  subscriptions(variables: Record<string, never>): SeriesSubscription[];
  watchLater(variables: Record<string, never>): List;
  watch(variables: {
    readonly id: string;
  }): Watch | null;
  watchThrough(variables: {
    readonly id: string;
  }): WatchThrough | null;
  watchThroughs(variables: {
    readonly status?: WatchThroughStatus | null;
  }): WatchThrough[];
}
export interface App {
  __typename: "App";
  id(variables: Record<string, never>): string;
  name(variables: Record<string, never>): string;
  icon(variables: Record<string, never>): Icon | null;
  extensions(variables: Record<string, never>): AppExtension[];
  isInstalled(variables: Record<string, never>): boolean;
}
export interface ClipsExtensionInstallation {
  __typename: "ClipsExtensionInstallation";
  id(variables: Record<string, never>): string;
  extension(variables: Record<string, never>): ClipsExtension;
  version(variables: Record<string, never>): ClipsExtensionVersion;
  extensionPoint(variables: Record<string, never>): ClipsExtensionPoint;
  appInstallation(variables: Record<string, never>): AppInstallation;
  configuration(variables: Record<string, never>): JSON | null;
}
export type ClipsExtensionPoint = string;
export interface ClipsExtensionPointConditionMatchInput {
  series?: ClipsExtensionPointSeriesConditionMatchInput | null;
}
export interface User {
  __typename: "User";
  id(variables: Record<string, never>): string;
  email(variables: Record<string, never>): Email;
  githubAccount(variables: Record<string, never>): GithubAccount | null;
  accessTokens(variables: Record<string, never>): PersonalAccessToken[];
  settings(variables: Record<string, never>): UserSettings;
  apps(variables: Record<string, never>): App[];
  app(variables: {
    readonly id: string;
  }): App | null;
}
export interface GithubAccount {
  __typename: "GithubAccount";
  id(variables: Record<string, never>): GithubID;
  username(variables: Record<string, never>): string;
  profileUrl(variables: Record<string, never>): Url;
  avatarImage(variables: Record<string, never>): Image | null;
}
export type GithubID = string;
export type Url = string;
export interface Image {
  __typename: "Image";
  source(variables: Record<string, never>): Url;
}
export interface PersonalAccessToken {
  __typename: "PersonalAccessToken";
  id(variables: Record<string, never>): string;
  label(variables: Record<string, never>): string | null;
  prefix(variables: Record<string, never>): string;
  length(variables: Record<string, never>): number;
  createdAt(variables: Record<string, never>): Date;
  lastUsedAt(variables: Record<string, never>): Date | null;
  lastFourCharacters(variables: Record<string, never>): string;
}
export type Date = string;
export interface UserSettings {
  __typename: "UserSettings";
  spoilerAvoidance(variables: Record<string, never>): SpoilerAvoidance;
}
export type SpoilerAvoidance = "NONE" | "UPCOMING" | "EVERYTHING";
export type Email = string;
export interface Icon {
  __typename: "Icon";
  source(variables: Record<string, never>): Url;
}
export type AppExtension = ClipsExtension;
export interface Mutation {
  __typename: "Mutation";
  createApp(variables: {
    readonly name: string;
  }): CreateAppPayload;
  deleteApp(variables: {
    readonly id: string;
  }): DeleteAppPayload;
  updateApp(variables: {
    readonly id: string;
    readonly name?: string | null;
  }): UpdateAppPayload;
  createClipsExtension(variables: {
    readonly name: string;
    readonly appId: string;
    readonly initialVersion?: CreateClipsInitialVersion | null;
  }): CreateClipsExtensionPayload;
  deleteClipsExtension(variables: {
    readonly id: string;
  }): DeleteClipsExtensionPayload;
  updateClipsExtension(variables: {
    readonly id: string;
    readonly name?: string | null;
  }): UpdateClipsExtensionPayload;
  pushClipsExtension(variables: {
    readonly extensionId: string;
    readonly hash: string;
    readonly name?: string | null;
    readonly translations?: JSON | null;
    readonly supports?: ClipsExtensionPointSupportInput[] | null;
    readonly configurationSchema?: ClipsExtensionConfigurationSchemaFieldsInput[] | null;
  }): PushClipsExtensionPayload;
  publishLatestClipsExtensionVersion(variables: {
    readonly extensionId: string;
  }): PublishClipsExtensionVersionPayload;
  installApp(variables: {
    readonly id: string;
  }): InstallAppPayload;
  installClipsExtension(variables: {
    readonly id: string;
    readonly extensionPoint?: ClipsExtensionPoint | null;
    readonly configuration?: JSON | null;
  }): InstallClipsExtensionPayload;
  uninstallClipsExtension(variables: {
    readonly id: string;
  }): UninstallClipsExtensionPayload;
  updateClipsExtensionInstallation(variables: {
    readonly id: string;
    readonly configuration?: JSON | null;
  }): UpdateClipsExtensionInstallationPayload;
  createAccount(variables: {
    readonly email: Email;
    readonly redirectTo?: Url | null;
  }): CreateAccountPayload;
  deleteAccount(variables: Record<string, never>): DeleteAccountPayload;
  signIn(variables: {
    readonly email: Email;
    readonly redirectTo?: Url | null;
  }): SignInPayload;
  signOut(variables: Record<string, never>): SignOutPayload;
  disconnectGithubAccount(variables: Record<string, never>): DisconnectGithubAccountPayload;
  createPersonalAccessToken(variables: {
    readonly label?: string | null;
  }): CreatePersonalAccessTokenPayload;
  deletePersonalAccessToken(variables: {
    readonly id?: string | null;
    readonly token?: string | null;
  }): DeletePersonalAccessTokenPayload;
  updateUserSettings(variables: {
    readonly spoilerAvoidance?: SpoilerAvoidance | null;
  }): UpdateUserSettingsPayload;
  updateSeason(variables: {
    readonly id: string;
    readonly status?: SeasonStatus | null;
  }): UpdateSeasonPayload;
  addToList(variables: {
    readonly id: string;
    readonly seriesId?: string | null;
  }): AddToListPayload;
  removeFromList(variables: {
    readonly id: string;
    readonly itemId: string;
  }): RemoveFromListPayload;
  ping(variables: Record<string, never>): boolean;
  subscribeToSeries(variables: {
    readonly id: string;
    readonly spoilerAvoidance?: SpoilerAvoidance | null;
  }): SubscribeToSeriesPayload;
  unsubscribeFromSeries(variables: {
    readonly id: string;
  }): UnsubscribeFromSeriesPayload;
  updateSeriesSubscriptionSettings(variables: {
    readonly id: string;
    readonly spoilerAvoidance: SpoilerAvoidance;
  }): UpdateSeriesSubscriptionSettingsPayload;
  watchLater(variables: {
    readonly seriesId?: string | null;
  }): WatchLaterPayload;
  removeFromWatchLater(variables: {
    readonly seriesId?: string | null;
  }): RemoveFromWatchLaterPayload;
  skipEpisode(variables: {
    readonly episode: string;
    readonly watchThrough?: string | null;
    readonly notes?: NotesInput | null;
    readonly at?: Date | null;
    readonly updateWatchLater?: boolean | null;
  }): SkipEpisodePayload;
  watchEpisode(variables: {
    readonly episode: string;
    readonly watchThrough?: string | null;
    readonly rating?: number | null;
    readonly notes?: NotesInput | null;
    readonly startedAt?: Date | null;
    readonly finishedAt?: Date | null;
    readonly updateWatchLater?: boolean | null;
  }): WatchEpisodePayload;
  watchEpisodesFromSeries(variables: {
    readonly series: string;
    readonly from?: EpisodeSliceInput | null;
    readonly to?: EpisodeSliceInput | null;
    readonly updateWatchLater?: boolean | null;
  }): WatchEpisodesFromSeriesPayload;
  startWatchThrough(variables: {
    readonly series: string;
    readonly from?: EpisodeSliceInput | null;
    readonly to?: EpisodeSliceInput | null;
    readonly includeSpecials?: boolean | null;
    readonly spoilerAvoidance?: SpoilerAvoidance | null;
    readonly updateWatchLater?: boolean | null;
  }): StartWatchThroughPayload;
  stopWatchThrough(variables: {
    readonly id: string;
    readonly watchLater?: boolean | null;
  }): StopWatchThroughPayload;
  deleteWatchThrough(variables: {
    readonly id: string;
    readonly watchLater?: boolean | null;
  }): DeleteWatchThroughPayload;
  updateWatchThroughSettings(variables: {
    readonly id: string;
    readonly spoilerAvoidance?: SpoilerAvoidance | null;
  }): UpdateWatchThroughSettingsPayload;
  deleteWatch(variables: {
    readonly id: string;
  }): DeleteWatchPayload;
}
export interface CreateAppPayload {
  __typename: "CreateAppPayload";
  app(variables: Record<string, never>): App | null;
}
export interface DeleteAppPayload {
  __typename: "DeleteAppPayload";
  deletedId(variables: Record<string, never>): string | null;
}
export interface UpdateAppPayload {
  __typename: "UpdateAppPayload";
  app(variables: Record<string, never>): App | null;
}
export interface CreateClipsInitialVersion {
  hash: string;
  translations?: JSON | null;
  supports?: ClipsExtensionPointSupportInput[] | null;
  configurationSchema?: ClipsExtensionConfigurationSchemaFieldsInput[] | null;
}
export interface CreateClipsExtensionPayload {
  __typename: "CreateClipsExtensionPayload";
  app(variables: Record<string, never>): App | null;
  extension(variables: Record<string, never>): ClipsExtension | null;
  version(variables: Record<string, never>): ClipsExtensionVersion | null;
  signedScriptUpload(variables: Record<string, never>): Url | null;
}
export interface DeleteClipsExtensionPayload {
  __typename: "DeleteClipsExtensionPayload";
  app(variables: Record<string, never>): App | null;
  deletedId(variables: Record<string, never>): string | null;
}
export interface UpdateClipsExtensionPayload {
  __typename: "UpdateClipsExtensionPayload";
  app(variables: Record<string, never>): App | null;
  extension(variables: Record<string, never>): ClipsExtension | null;
}
export interface ClipsExtensionPointSupportInput {
  name: ClipsExtensionPoint;
  conditions?: ClipsExtensionPointConditionInput[] | null;
}
export interface ClipsExtensionConfigurationSchemaFieldsInput {
  string?: ClipsExtensionConfigurationSchemaStringFieldInput | null;
  number?: ClipsExtensionConfigurationSchemaNumberFieldInput | null;
  options?: ClipsExtensionConfigurationSchemaOptionsFieldInput | null;
}
export interface PushClipsExtensionPayload {
  __typename: "PushClipsExtensionPayload";
  extension(variables: Record<string, never>): ClipsExtension | null;
  version(variables: Record<string, never>): ClipsExtensionVersion | null;
  signedScriptUpload(variables: Record<string, never>): Url | null;
}
export interface PublishClipsExtensionVersionPayload {
  __typename: "PublishClipsExtensionVersionPayload";
  extension(variables: Record<string, never>): ClipsExtension | null;
  version(variables: Record<string, never>): ClipsExtensionVersion | null;
}
export interface InstallAppPayload {
  __typename: "InstallAppPayload";
  app(variables: Record<string, never>): App | null;
  installation(variables: Record<string, never>): AppInstallation | null;
}
export interface InstallClipsExtensionPayload {
  __typename: "InstallClipsExtensionPayload";
  extension(variables: Record<string, never>): ClipsExtension | null;
  installation(variables: Record<string, never>): ClipsExtensionInstallation | null;
}
export interface UninstallClipsExtensionPayload {
  __typename: "UninstallClipsExtensionPayload";
  extension(variables: Record<string, never>): ClipsExtension | null;
  deletedInstallationId(variables: Record<string, never>): string | null;
}
export interface UpdateClipsExtensionInstallationPayload {
  __typename: "UpdateClipsExtensionInstallationPayload";
  extension(variables: Record<string, never>): ClipsExtension | null;
  installation(variables: Record<string, never>): ClipsExtensionInstallation | null;
}
export interface CreateAccountPayload {
  __typename: "CreateAccountPayload";
  email(variables: Record<string, never>): Email;
}
export interface DeleteAccountPayload {
  __typename: "DeleteAccountPayload";
  deletedId(variables: Record<string, never>): string;
}
export interface SignInPayload {
  __typename: "SignInPayload";
  email(variables: Record<string, never>): Email;
}
export interface SignOutPayload {
  __typename: "SignOutPayload";
  userId(variables: Record<string, never>): string;
}
export interface DisconnectGithubAccountPayload {
  __typename: "DisconnectGithubAccountPayload";
  deletedAccount(variables: Record<string, never>): GithubAccount | null;
}
export interface CreatePersonalAccessTokenPayload {
  __typename: "CreatePersonalAccessTokenPayload";
  plaintextToken(variables: Record<string, never>): string | null;
  personalAccessToken(variables: Record<string, never>): PersonalAccessToken | null;
}
export interface DeletePersonalAccessTokenPayload {
  __typename: "DeletePersonalAccessTokenPayload";
  deletedPersonalAccessTokenId(variables: Record<string, never>): string | null;
}
export interface UpdateUserSettingsPayload {
  __typename: "UpdateUserSettingsPayload";
  user(variables: Record<string, never>): User;
}
export interface ClipsExtension {
  __typename: "ClipsExtension";
  id(variables: Record<string, never>): string;
  name(variables: Record<string, never>): string;
  app(variables: Record<string, never>): App;
  latestVersion(variables: Record<string, never>): ClipsExtensionVersion | null;
  versions(variables: Record<string, never>): ClipsExtensionVersion[];
  isInstalled(variables: Record<string, never>): boolean;
}
export interface ClipsExtensionVersion {
  __typename: "ClipsExtensionVersion";
  id(variables: Record<string, never>): string;
  status(variables: Record<string, never>): ClipsExtensionVersionStatus;
  assets(variables: Record<string, never>): Asset[];
  apiVersion(variables: Record<string, never>): ClipsExtensionApiVersion;
  extension(variables: Record<string, never>): ClipsExtension;
  supports(variables: Record<string, never>): ClipsExtensionPointSupport[];
  configurationSchema(variables: Record<string, never>): ClipsExtensionConfigurationField[];
  translations(variables: Record<string, never>): JSON | null;
}
export type ClipsExtensionVersionStatus = "PUBLISHED" | "BUILDING";
export interface Asset {
  __typename: "Asset";
  source(variables: Record<string, never>): Url;
}
export type ClipsExtensionApiVersion = string;
export interface ClipsExtensionPointSupport {
  __typename: "ClipsExtensionPointSupport";
  name(variables: Record<string, never>): ClipsExtensionPoint;
  conditions(variables: Record<string, never>): ClipsExtensionPointCondition[];
}
export interface ClipsExtensionPointCondition {
  __typename: "ClipsExtensionPointCondition";
  series(variables: Record<string, never>): ClipsExtensionPointSeriesCondition | null;
}
export interface ClipsExtensionPointSeriesCondition {
  __typename: "ClipsExtensionPointSeriesCondition";
  handle(variables: Record<string, never>): string | null;
}
export type ClipsExtensionConfigurationField = ClipsExtensionStringConfigurationField | ClipsExtensionNumberConfigurationField | ClipsExtensionOptionsConfigurationField;
export interface ClipsExtensionStringConfigurationField {
  __typename: "ClipsExtensionStringConfigurationField";
  key(variables: Record<string, never>): string;
  label(variables: Record<string, never>): ClipsExtensionConfigurationString;
  default(variables: Record<string, never>): string | null;
}
export type ClipsExtensionConfigurationString = ClipsExtensionConfigurationStringTranslation | ClipsExtensionConfigurationStringStatic;
export interface ClipsExtensionConfigurationStringTranslation {
  __typename: "ClipsExtensionConfigurationStringTranslation";
  key(variables: Record<string, never>): TranslationKey;
}
export type TranslationKey = string;
export interface ClipsExtensionConfigurationStringStatic {
  __typename: "ClipsExtensionConfigurationStringStatic";
  value(variables: Record<string, never>): string;
}
export interface ClipsExtensionNumberConfigurationField {
  __typename: "ClipsExtensionNumberConfigurationField";
  key(variables: Record<string, never>): string;
  label(variables: Record<string, never>): ClipsExtensionConfigurationString;
  default(variables: Record<string, never>): number | null;
}
export interface ClipsExtensionOptionsConfigurationField {
  __typename: "ClipsExtensionOptionsConfigurationField";
  key(variables: Record<string, never>): string;
  label(variables: Record<string, never>): ClipsExtensionConfigurationString;
  default(variables: Record<string, never>): string | null;
  options(variables: Record<string, never>): ClipsExtensionOptionConfigurationFieldOption[];
}
export interface ClipsExtensionOptionConfigurationFieldOption {
  __typename: "ClipsExtensionOptionConfigurationFieldOption";
  value(variables: Record<string, never>): string;
  label(variables: Record<string, never>): ClipsExtensionConfigurationString;
}
export type JSON = string;
export interface ClipsExtensionPointSeriesConditionInput {
  handle?: string | null;
}
export interface ClipsExtensionPointConditionInput {
  series?: ClipsExtensionPointSeriesConditionInput | null;
}
export interface ClipsExtensionPointSeriesConditionMatchInput {
  id?: string | null;
  handle?: string | null;
}
export interface ClipsExtensionConfigurationSchema {
  __typename: "ClipsExtensionConfigurationSchema";
  fields(variables: Record<string, never>): ClipsExtensionConfigurationField[];
}
export interface ClipsExtensionTypedConfigurationField {
  __possibleTypes: ClipsExtensionStringConfigurationField | ClipsExtensionNumberConfigurationField | ClipsExtensionOptionsConfigurationField;
  key(variables: Record<string, never>): string;
  label(variables: Record<string, never>): ClipsExtensionConfigurationString;
}
export interface ClipsExtensionConfigurationSchemaStringFieldInput {
  key: string;
  label: ClipsExtensionConfigurationStringInput;
  default?: string | null;
}
export interface ClipsExtensionConfigurationSchemaNumberFieldInput {
  key: string;
  label: ClipsExtensionConfigurationStringInput;
  default?: number | null;
}
export interface ClipsExtensionConfigurationSchemaOptionsFieldInput {
  key: string;
  label: ClipsExtensionConfigurationStringInput;
  default?: string | null;
  options: ClipsExtensionOptionConfigurationFieldOptionInput[];
}
export interface ClipsExtensionConfigurationStringInput {
  static?: string | null;
  translation?: TranslationKey | null;
}
export interface ClipsExtensionOptionConfigurationFieldOptionInput {
  value: string;
  label: ClipsExtensionConfigurationStringInput;
}
export interface AppInstallation {
  __typename: "AppInstallation";
  id(variables: Record<string, never>): string;
  app(variables: Record<string, never>): App;
  extensions(variables: Record<string, never>): AppExtensionInstallation[];
}
export type AppExtensionInstallation = ClipsExtensionInstallation;
export interface List {
  __typename: "List";
  id(variables: Record<string, never>): string;
  items(variables: Record<string, never>): ListItem[];
}
export interface Series {
  __typename: "Series";
  id(variables: Record<string, never>): string;
  handle(variables: Record<string, never>): string;
  tmdbId(variables: Record<string, never>): string;
  tmdbUrl(variables: Record<string, never>): Url;
  imdbId(variables: Record<string, never>): string;
  imdbUrl(variables: Record<string, never>): Url;
  name(variables: Record<string, never>): string;
  poster(variables: Record<string, never>): Image | null;
  overview(variables: Record<string, never>): string | null;
  firstAired(variables: Record<string, never>): Date | null;
  status(variables: Record<string, never>): SeriesStatus;
  seasons(variables: Record<string, never>): Season[];
  season(variables: {
    readonly number: number;
  }): Season | null;
  episodes(variables: Record<string, never>): Episode[];
  episode(variables: {
    readonly number: number;
    readonly seasonNumber: number;
  }): Episode | null;
  lists(variables: Record<string, never>): List[];
  subscription(variables: Record<string, never>): SeriesSubscription | null;
  inWatchLater(variables: Record<string, never>): boolean;
  watchThroughs(variables: Record<string, never>): WatchThrough[];
}
export type SeriesStatus = "RETURNING" | "ENDED" | "CANCELLED";
export interface Season {
  __typename: "Season";
  id(variables: Record<string, never>): string;
  tmdbUrl(variables: Record<string, never>): Url;
  imdbUrl(variables: Record<string, never>): Url;
  series(variables: Record<string, never>): Series;
  number(variables: Record<string, never>): number;
  episodes(variables: Record<string, never>): Episode[];
  firstAired(variables: Record<string, never>): Date | null;
  poster(variables: Record<string, never>): Image | null;
  overview(variables: Record<string, never>): string | null;
  isSpecials(variables: Record<string, never>): boolean;
  status(variables: Record<string, never>): SeasonStatus;
  lists(variables: Record<string, never>): List[];
  watches(variables: Record<string, never>): Watch[];
  skips(variables: Record<string, never>): Skip[];
  latestWatch(variables: Record<string, never>): Watch | null;
  latestSkip(variables: Record<string, never>): Skip | null;
}
export interface Episode {
  __typename: "Episode";
  id(variables: Record<string, never>): string;
  title(variables: Record<string, never>): string;
  series(variables: Record<string, never>): Series;
  season(variables: Record<string, never>): Season;
  number(variables: Record<string, never>): number;
  firstAired(variables: Record<string, never>): Date | null;
  still(variables: Record<string, never>): Image | null;
  overview(variables: Record<string, never>): string | null;
  lists(variables: Record<string, never>): List[];
  watches(variables: Record<string, never>): Watch[];
  skips(variables: Record<string, never>): Skip[];
  latestWatch(variables: Record<string, never>): Watch | null;
  latestSkip(variables: Record<string, never>): Skip | null;
}
export type SeasonStatus = "CONTINUING" | "ENDED";
export interface ListItem {
  __typename: "ListItem";
  id(variables: Record<string, never>): string;
  position(variables: Record<string, never>): number;
  media(variables: Record<string, never>): Listable;
}
export interface Listable {
  __possibleTypes: Series | Season | Episode;
  id(variables: Record<string, never>): string;
  lists(variables: Record<string, never>): List[];
}
export interface UpdateSeasonPayload {
  __typename: "UpdateSeasonPayload";
  season(variables: Record<string, never>): Season | null;
}
export interface AddToListPayload {
  __typename: "AddToListPayload";
  list(variables: Record<string, never>): List | null;
  item(variables: Record<string, never>): ListItem | null;
  series(variables: Record<string, never>): Series | null;
}
export interface RemoveFromListPayload {
  __typename: "RemoveFromListPayload";
  list(variables: Record<string, never>): List | null;
  series(variables: Record<string, never>): Series | null;
  removedListItemId(variables: Record<string, never>): string | null;
}
export interface EpisodeSliceInput {
  season: number;
  episode?: number | null;
}
export interface EpisodeSlice {
  __typename: "EpisodeSlice";
  season(variables: Record<string, never>): number;
  episode(variables: Record<string, never>): number | null;
}
export interface SearchResults {
  __typename: "SearchResults";
  series(variables: Record<string, never>): Series[];
}
export type ApiVersion = string;
export type FormattedText = string;
export interface SeriesSubscription {
  __typename: "SeriesSubscription";
  id(variables: Record<string, never>): string;
  series(variables: Record<string, never>): Series;
  subscribedOn(variables: Record<string, never>): Date;
  settings(variables: Record<string, never>): SeriesSubscriptionSettings;
}
export interface SeriesSubscriptionSettings {
  __typename: "SeriesSubscriptionSettings";
  spoilerAvoidance(variables: Record<string, never>): SpoilerAvoidance;
}
export interface SubscribeToSeriesPayload {
  __typename: "SubscribeToSeriesPayload";
  subscription(variables: Record<string, never>): SeriesSubscription | null;
}
export interface UnsubscribeFromSeriesPayload {
  __typename: "UnsubscribeFromSeriesPayload";
  deletedSubscriptionId(variables: Record<string, never>): string;
}
export interface UpdateSeriesSubscriptionSettingsPayload {
  __typename: "UpdateSeriesSubscriptionSettingsPayload";
  subscription(variables: Record<string, never>): SeriesSubscription | null;
}
export interface WatchLaterPayload {
  __typename: "WatchLaterPayload";
  list(variables: Record<string, never>): List;
  item(variables: Record<string, never>): ListItem | null;
  series(variables: Record<string, never>): Series | null;
}
export interface RemoveFromWatchLaterPayload {
  __typename: "RemoveFromWatchLaterPayload";
  list(variables: Record<string, never>): List;
  series(variables: Record<string, never>): Series | null;
  removedListItemId(variables: Record<string, never>): string | null;
}
export interface Watch {
  __typename: "Watch";
  id(variables: Record<string, never>): string;
  media(variables: Record<string, never>): Watchable;
  startedAt(variables: Record<string, never>): Date | null;
  finishedAt(variables: Record<string, never>): Date | null;
  createdAt(variables: Record<string, never>): Date;
  updatedAt(variables: Record<string, never>): Date;
  rating(variables: Record<string, never>): number | null;
  notes(variables: Record<string, never>): Notes | null;
  watchThrough(variables: Record<string, never>): WatchThrough | null;
}
export interface WatchThrough {
  __typename: "WatchThrough";
  id(variables: Record<string, never>): string;
  series(variables: Record<string, never>): Series;
  from(variables: Record<string, never>): EpisodeSlice;
  to(variables: Record<string, never>): EpisodeSlice;
  startedAt(variables: Record<string, never>): Date | null;
  createdAt(variables: Record<string, never>): Date;
  updatedAt(variables: Record<string, never>): Date;
  finishedAt(variables: Record<string, never>): Date | null;
  status(variables: Record<string, never>): WatchThroughStatus;
  watches(variables: Record<string, never>): Watch[];
  actions(variables: Record<string, never>): Action[];
  nextEpisode(variables: Record<string, never>): Episode | null;
  unfinishedEpisodeCount(variables: Record<string, never>): number;
  settings(variables: Record<string, never>): WatchThroughSettings;
}
export type WatchThroughStatus = "ONGOING" | "STOPPED" | "FINISHED";
export type Action = Watch | Skip;
export interface Watchable {
  __possibleTypes: Season | Episode;
  id(variables: Record<string, never>): string;
  watches(variables: Record<string, never>): Watch[];
  latestWatch(variables: Record<string, never>): Watch | null;
}
export interface Notes {
  __typename: "Notes";
  content(variables: Record<string, never>): FormattedText;
  containsSpoilers(variables: Record<string, never>): boolean;
}
export interface Skip {
  __typename: "Skip";
  id(variables: Record<string, never>): string;
  at(variables: Record<string, never>): Date | null;
  createdAt(variables: Record<string, never>): Date;
  updatedAt(variables: Record<string, never>): Date;
  media(variables: Record<string, never>): Skippable;
  notes(variables: Record<string, never>): Notes | null;
  watchThrough(variables: Record<string, never>): WatchThrough | null;
}
export interface Skippable {
  __possibleTypes: Season | Episode;
  id(variables: Record<string, never>): string;
  skips(variables: Record<string, never>): Skip[];
  latestSkip(variables: Record<string, never>): Skip | null;
}
export interface WatchThroughSettings {
  __typename: "WatchThroughSettings";
  spoilerAvoidance(variables: Record<string, never>): SpoilerAvoidance;
}
export interface NotesInput {
  content: FormattedText;
  containsSpoilers: boolean;
}
export interface SkipEpisodePayload {
  __typename: "SkipEpisodePayload";
  skip(variables: Record<string, never>): Skip | null;
  episode(variables: Record<string, never>): Episode | null;
  watchThrough(variables: Record<string, never>): WatchThrough | null;
  watchLater(variables: Record<string, never>): List;
}
export interface WatchEpisodePayload {
  __typename: "WatchEpisodePayload";
  watch(variables: Record<string, never>): Watch | null;
  episode(variables: Record<string, never>): Episode | null;
  watchThrough(variables: Record<string, never>): WatchThrough | null;
  watchLater(variables: Record<string, never>): List;
}
export interface WatchEpisodesFromSeriesPayload {
  __typename: "WatchEpisodesFromSeriesPayload";
  series(variables: Record<string, never>): Series | null;
  watchLater(variables: Record<string, never>): List;
}
export interface StartWatchThroughPayload {
  __typename: "StartWatchThroughPayload";
  watchThrough(variables: Record<string, never>): WatchThrough | null;
  watchLater(variables: Record<string, never>): List;
}
export interface StopWatchThroughPayload {
  __typename: "StopWatchThroughPayload";
  watchThrough(variables: Record<string, never>): WatchThrough | null;
  watchLater(variables: Record<string, never>): List;
}
export interface DeleteWatchThroughPayload {
  __typename: "DeleteWatchThroughPayload";
  deletedWatchThroughId(variables: Record<string, never>): string;
  watchLater(variables: Record<string, never>): List;
}
export interface UpdateWatchThroughSettingsPayload {
  __typename: "UpdateWatchThroughSettingsPayload";
  watchThrough(variables: Record<string, never>): WatchThrough | null;
}
export interface DeleteWatchPayload {
  __typename: "DeleteWatchPayload";
  deletedWatchId(variables: Record<string, never>): string;
  watchThrough(variables: Record<string, never>): WatchThrough | null;
}
export interface Schema {
  Query: Query;
  App: App;
  ClipsExtensionInstallation: ClipsExtensionInstallation;
  ClipsExtensionPoint: ClipsExtensionPoint;
  ClipsExtensionPointConditionMatchInput: ClipsExtensionPointConditionMatchInput;
  User: User;
  GithubAccount: GithubAccount;
  GithubID: GithubID;
  Url: Url;
  Image: Image;
  PersonalAccessToken: PersonalAccessToken;
  Date: Date;
  UserSettings: UserSettings;
  SpoilerAvoidance: SpoilerAvoidance;
  Email: Email;
  Icon: Icon;
  AppExtension: AppExtension;
  Mutation: Mutation;
  CreateAppPayload: CreateAppPayload;
  DeleteAppPayload: DeleteAppPayload;
  UpdateAppPayload: UpdateAppPayload;
  CreateClipsInitialVersion: CreateClipsInitialVersion;
  CreateClipsExtensionPayload: CreateClipsExtensionPayload;
  DeleteClipsExtensionPayload: DeleteClipsExtensionPayload;
  UpdateClipsExtensionPayload: UpdateClipsExtensionPayload;
  ClipsExtensionPointSupportInput: ClipsExtensionPointSupportInput;
  ClipsExtensionConfigurationSchemaFieldsInput: ClipsExtensionConfigurationSchemaFieldsInput;
  PushClipsExtensionPayload: PushClipsExtensionPayload;
  PublishClipsExtensionVersionPayload: PublishClipsExtensionVersionPayload;
  InstallAppPayload: InstallAppPayload;
  InstallClipsExtensionPayload: InstallClipsExtensionPayload;
  UninstallClipsExtensionPayload: UninstallClipsExtensionPayload;
  UpdateClipsExtensionInstallationPayload: UpdateClipsExtensionInstallationPayload;
  CreateAccountPayload: CreateAccountPayload;
  DeleteAccountPayload: DeleteAccountPayload;
  SignInPayload: SignInPayload;
  SignOutPayload: SignOutPayload;
  DisconnectGithubAccountPayload: DisconnectGithubAccountPayload;
  CreatePersonalAccessTokenPayload: CreatePersonalAccessTokenPayload;
  DeletePersonalAccessTokenPayload: DeletePersonalAccessTokenPayload;
  UpdateUserSettingsPayload: UpdateUserSettingsPayload;
  ClipsExtension: ClipsExtension;
  ClipsExtensionVersion: ClipsExtensionVersion;
  ClipsExtensionVersionStatus: ClipsExtensionVersionStatus;
  Asset: Asset;
  ClipsExtensionApiVersion: ClipsExtensionApiVersion;
  ClipsExtensionPointSupport: ClipsExtensionPointSupport;
  ClipsExtensionPointCondition: ClipsExtensionPointCondition;
  ClipsExtensionPointSeriesCondition: ClipsExtensionPointSeriesCondition;
  ClipsExtensionConfigurationField: ClipsExtensionConfigurationField;
  ClipsExtensionStringConfigurationField: ClipsExtensionStringConfigurationField;
  ClipsExtensionConfigurationString: ClipsExtensionConfigurationString;
  ClipsExtensionConfigurationStringTranslation: ClipsExtensionConfigurationStringTranslation;
  TranslationKey: TranslationKey;
  ClipsExtensionConfigurationStringStatic: ClipsExtensionConfigurationStringStatic;
  ClipsExtensionNumberConfigurationField: ClipsExtensionNumberConfigurationField;
  ClipsExtensionOptionsConfigurationField: ClipsExtensionOptionsConfigurationField;
  ClipsExtensionOptionConfigurationFieldOption: ClipsExtensionOptionConfigurationFieldOption;
  JSON: JSON;
  ClipsExtensionPointSeriesConditionInput: ClipsExtensionPointSeriesConditionInput;
  ClipsExtensionPointConditionInput: ClipsExtensionPointConditionInput;
  ClipsExtensionPointSeriesConditionMatchInput: ClipsExtensionPointSeriesConditionMatchInput;
  ClipsExtensionConfigurationSchema: ClipsExtensionConfigurationSchema;
  ClipsExtensionTypedConfigurationField: ClipsExtensionTypedConfigurationField;
  ClipsExtensionConfigurationSchemaStringFieldInput: ClipsExtensionConfigurationSchemaStringFieldInput;
  ClipsExtensionConfigurationSchemaNumberFieldInput: ClipsExtensionConfigurationSchemaNumberFieldInput;
  ClipsExtensionConfigurationSchemaOptionsFieldInput: ClipsExtensionConfigurationSchemaOptionsFieldInput;
  ClipsExtensionConfigurationStringInput: ClipsExtensionConfigurationStringInput;
  ClipsExtensionOptionConfigurationFieldOptionInput: ClipsExtensionOptionConfigurationFieldOptionInput;
  AppInstallation: AppInstallation;
  AppExtensionInstallation: AppExtensionInstallation;
  List: List;
  Series: Series;
  SeriesStatus: SeriesStatus;
  Season: Season;
  Episode: Episode;
  SeasonStatus: SeasonStatus;
  ListItem: ListItem;
  Listable: Listable;
  UpdateSeasonPayload: UpdateSeasonPayload;
  AddToListPayload: AddToListPayload;
  RemoveFromListPayload: RemoveFromListPayload;
  EpisodeSliceInput: EpisodeSliceInput;
  EpisodeSlice: EpisodeSlice;
  SearchResults: SearchResults;
  ApiVersion: ApiVersion;
  FormattedText: FormattedText;
  SeriesSubscription: SeriesSubscription;
  SeriesSubscriptionSettings: SeriesSubscriptionSettings;
  SubscribeToSeriesPayload: SubscribeToSeriesPayload;
  UnsubscribeFromSeriesPayload: UnsubscribeFromSeriesPayload;
  UpdateSeriesSubscriptionSettingsPayload: UpdateSeriesSubscriptionSettingsPayload;
  WatchLaterPayload: WatchLaterPayload;
  RemoveFromWatchLaterPayload: RemoveFromWatchLaterPayload;
  Watch: Watch;
  WatchThrough: WatchThrough;
  WatchThroughStatus: WatchThroughStatus;
  Action: Action;
  Watchable: Watchable;
  Notes: Notes;
  Skip: Skip;
  Skippable: Skippable;
  WatchThroughSettings: WatchThroughSettings;
  NotesInput: NotesInput;
  SkipEpisodePayload: SkipEpisodePayload;
  WatchEpisodePayload: WatchEpisodePayload;
  WatchEpisodesFromSeriesPayload: WatchEpisodesFromSeriesPayload;
  StartWatchThroughPayload: StartWatchThroughPayload;
  StopWatchThroughPayload: StopWatchThroughPayload;
  DeleteWatchThroughPayload: DeleteWatchThroughPayload;
  UpdateWatchThroughSettingsPayload: UpdateWatchThroughSettingsPayload;
  DeleteWatchPayload: DeleteWatchPayload;
}
const schema = `
type Query {
  apps: [App!]!
  app(id: ID!): App
  clipsInstallation(id: ID!): ClipsExtensionInstallation
  clipsInstallations(extensionPoint: ClipsExtensionPoint, conditions: [ClipsExtensionPointConditionMatchInput!]): [ClipsExtensionInstallation!]!
  me: User!
  my: User!
  lists: [List!]!
  list(id: ID!): List
  series(id: ID!): Series
  version: ApiVersion
  search(query: String!): SearchResults!
  subscription(id: ID!): SeriesSubscription
  subscriptions: [SeriesSubscription!]!
  watchLater: List!
  watch(id: ID!): Watch
  watchThrough(id: ID!): WatchThrough
  watchThroughs(status: WatchThroughStatus): [WatchThrough!]!
}

type App {
  id: ID!
  name: String!
  icon: Icon
  extensions: [AppExtension!]!
  isInstalled: Boolean!
}

type ClipsExtensionInstallation {
  id: ID!
  extension: ClipsExtension!
  version: ClipsExtensionVersion!
  extensionPoint: ClipsExtensionPoint!
  appInstallation: AppInstallation!
  configuration: JSON
}

scalar ClipsExtensionPoint

input ClipsExtensionPointConditionMatchInput {
  series: ClipsExtensionPointSeriesConditionMatchInput
}

type User {
  id: ID!
  email: Email!
  githubAccount: GithubAccount
  accessTokens: [PersonalAccessToken!]!
  settings: UserSettings!
  apps: [App!]!
  app(id: ID!): App
}

type GithubAccount {
  id: GithubID!
  username: String!
  profileUrl: Url!
  avatarImage: Image
}

scalar GithubID

scalar Url

type Image {
  source: Url!
}

type PersonalAccessToken {
  id: ID!
  label: String
  prefix: String!
  length: Int!
  createdAt: Date!
  lastUsedAt: Date
  lastFourCharacters: String!
}

scalar Date

type UserSettings {
  spoilerAvoidance: SpoilerAvoidance!
}

enum SpoilerAvoidance {
  NONE
  UPCOMING
  EVERYTHING
}

scalar Email

type Icon {
  source: Url!
}

union AppExtension = ClipsExtension

type Mutation {
  createApp(name: String!): CreateAppPayload!
  deleteApp(id: ID!): DeleteAppPayload!
  updateApp(id: ID!, name: String): UpdateAppPayload!
  createClipsExtension(name: String!, appId: ID!, initialVersion: CreateClipsInitialVersion): CreateClipsExtensionPayload!
  deleteClipsExtension(id: ID!): DeleteClipsExtensionPayload!
  updateClipsExtension(id: ID!, name: String): UpdateClipsExtensionPayload!
  pushClipsExtension(extensionId: ID!, hash: String!, name: String, translations: JSON, supports: [ClipsExtensionPointSupportInput!], configurationSchema: [ClipsExtensionConfigurationSchemaFieldsInput!]): PushClipsExtensionPayload!
  publishLatestClipsExtensionVersion(extensionId: ID!): PublishClipsExtensionVersionPayload!
  installApp(id: ID!): InstallAppPayload!
  installClipsExtension(id: ID!, extensionPoint: ClipsExtensionPoint, configuration: JSON): InstallClipsExtensionPayload!
  uninstallClipsExtension(id: ID!): UninstallClipsExtensionPayload!
  updateClipsExtensionInstallation(id: ID!, configuration: JSON): UpdateClipsExtensionInstallationPayload!
  createAccount(email: Email!, redirectTo: Url): CreateAccountPayload!
  deleteAccount: DeleteAccountPayload!
  signIn(email: Email!, redirectTo: Url): SignInPayload!
  signOut: SignOutPayload!
  disconnectGithubAccount: DisconnectGithubAccountPayload!
  createPersonalAccessToken(label: String): CreatePersonalAccessTokenPayload!
  deletePersonalAccessToken(id: ID, token: String): DeletePersonalAccessTokenPayload!
  updateUserSettings(spoilerAvoidance: SpoilerAvoidance): UpdateUserSettingsPayload!
  updateSeason(id: ID!, status: SeasonStatus): UpdateSeasonPayload!
  addToList(id: ID!, seriesId: ID): AddToListPayload!
  removeFromList(id: ID!, itemId: ID!): RemoveFromListPayload!
  ping: Boolean!
  subscribeToSeries(id: ID!, spoilerAvoidance: SpoilerAvoidance): SubscribeToSeriesPayload!
  unsubscribeFromSeries(id: ID!): UnsubscribeFromSeriesPayload!
  updateSeriesSubscriptionSettings(id: ID!, spoilerAvoidance: SpoilerAvoidance!): UpdateSeriesSubscriptionSettingsPayload!
  watchLater(seriesId: ID): WatchLaterPayload!
  removeFromWatchLater(seriesId: ID): RemoveFromWatchLaterPayload!
  skipEpisode(episode: ID!, watchThrough: ID, notes: NotesInput, at: Date, updateWatchLater: Boolean): SkipEpisodePayload!
  watchEpisode(episode: ID!, watchThrough: ID, rating: Int, notes: NotesInput, startedAt: Date, finishedAt: Date, updateWatchLater: Boolean): WatchEpisodePayload!
  watchEpisodesFromSeries(series: ID!, from: EpisodeSliceInput, to: EpisodeSliceInput, updateWatchLater: Boolean): WatchEpisodesFromSeriesPayload!
  startWatchThrough(series: ID!, from: EpisodeSliceInput, to: EpisodeSliceInput, includeSpecials: Boolean, spoilerAvoidance: SpoilerAvoidance, updateWatchLater: Boolean): StartWatchThroughPayload!
  stopWatchThrough(id: ID!, watchLater: Boolean): StopWatchThroughPayload!
  deleteWatchThrough(id: ID!, watchLater: Boolean): DeleteWatchThroughPayload!
  updateWatchThroughSettings(id: ID!, spoilerAvoidance: SpoilerAvoidance): UpdateWatchThroughSettingsPayload!
  deleteWatch(id: ID!): DeleteWatchPayload!
}

type CreateAppPayload {
  app: App
}

type DeleteAppPayload {
  deletedId: ID
}

type UpdateAppPayload {
  app: App
}

input CreateClipsInitialVersion {
  hash: String!
  translations: JSON
  supports: [ClipsExtensionPointSupportInput!]
  configurationSchema: [ClipsExtensionConfigurationSchemaFieldsInput!]
}

type CreateClipsExtensionPayload {
  app: App
  extension: ClipsExtension
  version: ClipsExtensionVersion
  signedScriptUpload: Url
}

type DeleteClipsExtensionPayload {
  app: App
  deletedId: ID
}

type UpdateClipsExtensionPayload {
  app: App
  extension: ClipsExtension
}

input ClipsExtensionPointSupportInput {
  name: ClipsExtensionPoint!
  conditions: [ClipsExtensionPointConditionInput!]
}

input ClipsExtensionConfigurationSchemaFieldsInput {
  string: ClipsExtensionConfigurationSchemaStringFieldInput
  number: ClipsExtensionConfigurationSchemaNumberFieldInput
  options: ClipsExtensionConfigurationSchemaOptionsFieldInput
}

type PushClipsExtensionPayload {
  extension: ClipsExtension
  version: ClipsExtensionVersion
  signedScriptUpload: Url
}

type PublishClipsExtensionVersionPayload {
  extension: ClipsExtension
  version: ClipsExtensionVersion
}

type InstallAppPayload {
  app: App
  installation: AppInstallation
}

type InstallClipsExtensionPayload {
  extension: ClipsExtension
  installation: ClipsExtensionInstallation
}

type UninstallClipsExtensionPayload {
  extension: ClipsExtension
  deletedInstallationId: ID
}

type UpdateClipsExtensionInstallationPayload {
  extension: ClipsExtension
  installation: ClipsExtensionInstallation
}

type CreateAccountPayload {
  email: Email!
}

type DeleteAccountPayload {
  deletedId: ID!
}

type SignInPayload {
  email: Email!
}

type SignOutPayload {
  userId: ID!
}

type DisconnectGithubAccountPayload {
  deletedAccount: GithubAccount
}

type CreatePersonalAccessTokenPayload {
  plaintextToken: String
  personalAccessToken: PersonalAccessToken
}

type DeletePersonalAccessTokenPayload {
  deletedPersonalAccessTokenId: ID
}

type UpdateUserSettingsPayload {
  user: User!
}

type ClipsExtension {
  id: ID!
  name: String!
  app: App!
  latestVersion: ClipsExtensionVersion
  versions: [ClipsExtensionVersion!]!
  isInstalled: Boolean!
}

type ClipsExtensionVersion {
  id: ID!
  status: ClipsExtensionVersionStatus!
  assets: [Asset!]!
  apiVersion: ClipsExtensionApiVersion!
  extension: ClipsExtension!
  supports: [ClipsExtensionPointSupport!]!
  configurationSchema: [ClipsExtensionConfigurationField!]!
  translations: JSON
}

enum ClipsExtensionVersionStatus {
  PUBLISHED
  BUILDING
}

type Asset {
  source: Url!
}

scalar ClipsExtensionApiVersion

type ClipsExtensionPointSupport {
  name: ClipsExtensionPoint!
  conditions: [ClipsExtensionPointCondition!]!
}

type ClipsExtensionPointCondition {
  series: ClipsExtensionPointSeriesCondition
}

type ClipsExtensionPointSeriesCondition {
  handle: String
}

union ClipsExtensionConfigurationField = ClipsExtensionStringConfigurationField | ClipsExtensionNumberConfigurationField | ClipsExtensionOptionsConfigurationField

type ClipsExtensionStringConfigurationField implements ClipsExtensionTypedConfigurationField {
  key: String!
  label: ClipsExtensionConfigurationString!
  default: String
}

union ClipsExtensionConfigurationString = ClipsExtensionConfigurationStringTranslation | ClipsExtensionConfigurationStringStatic

type ClipsExtensionConfigurationStringTranslation {
  key: TranslationKey!
}

scalar TranslationKey

type ClipsExtensionConfigurationStringStatic {
  value: String!
}

type ClipsExtensionNumberConfigurationField implements ClipsExtensionTypedConfigurationField {
  key: String!
  label: ClipsExtensionConfigurationString!
  default: Float
}

type ClipsExtensionOptionsConfigurationField implements ClipsExtensionTypedConfigurationField {
  key: String!
  label: ClipsExtensionConfigurationString!
  default: String
  options: [ClipsExtensionOptionConfigurationFieldOption!]!
}

type ClipsExtensionOptionConfigurationFieldOption {
  value: String!
  label: ClipsExtensionConfigurationString!
}

scalar JSON

input ClipsExtensionPointSeriesConditionInput {
  handle: String
}

input ClipsExtensionPointConditionInput {
  series: ClipsExtensionPointSeriesConditionInput
}

input ClipsExtensionPointSeriesConditionMatchInput {
  id: ID
  handle: String
}

type ClipsExtensionConfigurationSchema {
  fields: [ClipsExtensionConfigurationField!]!
}

interface ClipsExtensionTypedConfigurationField {
  key: String!
  label: ClipsExtensionConfigurationString!
}

input ClipsExtensionConfigurationSchemaStringFieldInput {
  key: String!
  label: ClipsExtensionConfigurationStringInput!
  default: String
}

input ClipsExtensionConfigurationSchemaNumberFieldInput {
  key: String!
  label: ClipsExtensionConfigurationStringInput!
  default: Float
}

input ClipsExtensionConfigurationSchemaOptionsFieldInput {
  key: String!
  label: ClipsExtensionConfigurationStringInput!
  default: String
  options: [ClipsExtensionOptionConfigurationFieldOptionInput!]!
}

input ClipsExtensionConfigurationStringInput {
  static: String
  translation: TranslationKey
}

input ClipsExtensionOptionConfigurationFieldOptionInput {
  value: String!
  label: ClipsExtensionConfigurationStringInput!
}

type AppInstallation {
  id: ID!
  app: App!
  extensions: [AppExtensionInstallation!]!
}

union AppExtensionInstallation = ClipsExtensionInstallation

type List {
  id: ID!
  items: [ListItem!]!
}

type Series implements Listable {
  id: ID!
  handle: String!
  tmdbId: ID!
  tmdbUrl: Url!
  imdbId: ID!
  imdbUrl: Url!
  name: String!
  poster: Image
  overview: String
  firstAired: Date
  status: SeriesStatus!
  seasons: [Season!]!
  season(number: Int!): Season
  episodes: [Episode!]!
  episode(number: Int!, seasonNumber: Int!): Episode
  lists: [List!]!
  subscription: SeriesSubscription
  inWatchLater: Boolean!
  watchThroughs: [WatchThrough!]!
}

enum SeriesStatus {
  RETURNING
  ENDED
  CANCELLED
}

type Season implements Listable & Watchable & Skippable {
  id: ID!
  tmdbUrl: Url!
  imdbUrl: Url!
  series: Series!
  number: Int!
  episodes: [Episode!]!
  firstAired: Date
  poster: Image
  overview: String
  isSpecials: Boolean!
  status: SeasonStatus!
  lists: [List!]!
  watches: [Watch!]!
  skips: [Skip!]!
  latestWatch: Watch
  latestSkip: Skip
}

type Episode implements Listable & Watchable & Skippable {
  id: ID!
  title: String!
  series: Series!
  season: Season!
  number: Int!
  firstAired: Date
  still: Image
  overview: String
  lists: [List!]!
  watches: [Watch!]!
  skips: [Skip!]!
  latestWatch: Watch
  latestSkip: Skip
}

enum SeasonStatus {
  CONTINUING
  ENDED
}

type ListItem {
  id: ID!
  position: Int!
  media: Listable!
}

interface Listable {
  id: ID!
  lists: [List!]!
}

type UpdateSeasonPayload {
  season: Season
}

type AddToListPayload {
  list: List
  item: ListItem
  series: Series
}

type RemoveFromListPayload {
  list: List
  series: Series
  removedListItemId: ID
}

input EpisodeSliceInput {
  season: Int!
  episode: Int
}

type EpisodeSlice {
  season: Int!
  episode: Int
}

type SearchResults {
  series: [Series!]!
}

scalar ApiVersion

scalar FormattedText

type SeriesSubscription {
  id: ID!
  series: Series!
  subscribedOn: Date!
  settings: SeriesSubscriptionSettings!
}

type SeriesSubscriptionSettings {
  spoilerAvoidance: SpoilerAvoidance!
}

type SubscribeToSeriesPayload {
  subscription: SeriesSubscription
}

type UnsubscribeFromSeriesPayload {
  deletedSubscriptionId: ID!
}

type UpdateSeriesSubscriptionSettingsPayload {
  subscription: SeriesSubscription
}

type WatchLaterPayload {
  list: List!
  item: ListItem
  series: Series
}

type RemoveFromWatchLaterPayload {
  list: List!
  series: Series
  removedListItemId: ID
}

type Watch {
  id: ID!
  media: Watchable!
  startedAt: Date
  finishedAt: Date
  createdAt: Date!
  updatedAt: Date!
  rating: Int
  notes: Notes
  watchThrough: WatchThrough
}

type WatchThrough {
  id: ID!
  series: Series!
  from: EpisodeSlice!
  to: EpisodeSlice!
  startedAt: Date
  createdAt: Date!
  updatedAt: Date!
  finishedAt: Date
  status: WatchThroughStatus!
  watches: [Watch!]!
  actions: [Action!]!
  nextEpisode: Episode
  unfinishedEpisodeCount: Int!
  settings: WatchThroughSettings!
}

enum WatchThroughStatus {
  ONGOING
  STOPPED
  FINISHED
}

union Action = Watch | Skip

interface Watchable {
  id: ID!
  watches: [Watch!]!
  latestWatch: Watch
}

type Notes {
  content: FormattedText!
  containsSpoilers: Boolean!
}

type Skip {
  id: ID!
  at: Date
  createdAt: Date!
  updatedAt: Date!
  media: Skippable!
  notes: Notes
  watchThrough: WatchThrough
}

interface Skippable {
  id: ID!
  skips: [Skip!]!
  latestSkip: Skip
}

type WatchThroughSettings {
  spoilerAvoidance: SpoilerAvoidance!
}

input NotesInput {
  content: FormattedText!
  containsSpoilers: Boolean!
}

type SkipEpisodePayload {
  skip: Skip
  episode: Episode
  watchThrough: WatchThrough
  watchLater: List!
}

type WatchEpisodePayload {
  watch: Watch
  episode: Episode
  watchThrough: WatchThrough
  watchLater: List!
}

type WatchEpisodesFromSeriesPayload {
  series: Series
  watchLater: List!
}

type StartWatchThroughPayload {
  watchThrough: WatchThrough
  watchLater: List!
}

type StopWatchThroughPayload {
  watchThrough: WatchThrough
  watchLater: List!
}

type DeleteWatchThroughPayload {
  deletedWatchThroughId: ID!
  watchLater: List!
}

type UpdateWatchThroughSettingsPayload {
  watchThrough: WatchThrough
}

type DeleteWatchPayload {
  deletedWatchId: ID!
  watchThrough: WatchThrough
}
`;
export default schema;