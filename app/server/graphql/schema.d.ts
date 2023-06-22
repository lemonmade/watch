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
        readonly target?: ClipsExtensionPoint | null;
        readonly conditions?: ClipsExtensionPointSupportConditionInput[] | null;
    }): ClipsExtensionInstallation[];
    me(variables: Record<string, never>): User;
    my(variables: Record<string, never>): User;
    series(variables: {
        readonly id?: string | null;
        readonly handle?: string | null;
    }): Series | null;
    season(variables: {
        readonly id: string;
    }): Season | null;
    randomSeries(variables: Record<string, never>): Series;
    lists(variables: Record<string, never>): List[];
    list(variables: {
        readonly id: string;
    }): List | null;
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
    randomWatchThrough(variables: Record<string, never>): WatchThrough | null;
}
export interface App {
    __typename: "App";
    id(variables: Record<string, never>): string;
    name(variables: Record<string, never>): string;
    handle(variables: Record<string, never>): string;
    icon(variables: Record<string, never>): Icon | null;
    extensions(variables: Record<string, never>): AppExtension[];
    isInstalled(variables: Record<string, never>): boolean;
}
export interface ClipsExtensionInstallation {
    __typename: "ClipsExtensionInstallation";
    id(variables: Record<string, never>): string;
    extension(variables: Record<string, never>): ClipsExtension;
    version(variables: Record<string, never>): ClipsExtensionVersion;
    target(variables: Record<string, never>): ClipsExtensionPoint;
    appInstallation(variables: Record<string, never>): AppInstallation;
    settings(variables: Record<string, never>): JSON | null;
    translations(variables: Record<string, never>): JSON | null;
    liveQuery(variables: Record<string, never>): ClipsLiveQuery | null;
    loading(variables: Record<string, never>): ClipsExtensionPointSupportLoading | null;
}
export type ClipsExtensionPoint = string;
export interface ClipsExtensionPointSupportConditionInput {
    series?: ClipsExtensionPointSupportSeriesConditionInput | null;
}
export interface User {
    __typename: "User";
    id(variables: Record<string, never>): string;
    role(variables: Record<string, never>): UserRole;
    level(variables: Record<string, never>): UserLevel;
    email(variables: Record<string, never>): Email;
    githubAccount(variables: Record<string, never>): GithubAccount | null;
    googleAccount(variables: Record<string, never>): GoogleAccount | null;
    passkeys(variables: Record<string, never>): Passkey[];
    accessTokens(variables: Record<string, never>): PersonalAccessToken[];
    settings(variables: Record<string, never>): UserSettings;
    giftCode(variables: Record<string, never>): RedeemedAccountGiftCode | null;
    subscription(variables: Record<string, never>): Subscription | null;
    apps(variables: Record<string, never>): App[];
    app(variables: {
        readonly id?: string | null;
        readonly handle?: string | null;
    }): App | null;
}
export type UserRole = "REGULAR" | "ADMIN";
export type UserLevel = "FREE" | "MEMBER" | "PATRON";
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
export interface GoogleAccount {
    __typename: "GoogleAccount";
    id(variables: Record<string, never>): GoogleID;
    email(variables: Record<string, never>): Email;
    image(variables: Record<string, never>): Image | null;
    createdAt(variables: Record<string, never>): Date;
    updatedAt(variables: Record<string, never>): Date;
}
export type GoogleID = string;
export type Email = string;
export type Date = string;
export interface Passkey {
    __typename: "Passkey";
    id(variables: Record<string, never>): string;
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
export interface UserSettings {
    __typename: "UserSettings";
    spoilerAvoidance(variables: Record<string, never>): SpoilerAvoidance;
}
export type SpoilerAvoidance = "NONE" | "UPCOMING" | "EVERYTHING";
export interface RedeemedAccountGiftCode {
    __typename: "RedeemedAccountGiftCode";
    code(variables: Record<string, never>): string;
    redeemedAt(variables: Record<string, never>): Date;
}
export interface Subscription {
    __typename: "Subscription";
    id(variables: Record<string, never>): string;
    level(variables: Record<string, never>): SubscriptionLevel;
    status(variables: Record<string, never>): SubscriptionStatus;
    startedAt(variables: Record<string, never>): Date | null;
    endedAt(variables: Record<string, never>): Date | null;
    paymentFlow(variables: Record<string, never>): SubscriptionPaymentFlow | null;
}
export type SubscriptionLevel = "MEMBER" | "PATRON";
export type SubscriptionStatus = "ACTIVE" | "INACTIVE";
export interface SubscriptionPaymentFlow {
    __typename: "SubscriptionPaymentFlow";
    apiKey(variables: Record<string, never>): string;
    level(variables: Record<string, never>): SubscriptionLevel;
    clientSecret(variables: Record<string, never>): string;
}
export interface Series {
    __typename: "Series";
    id(variables: Record<string, never>): string;
    handle(variables: Record<string, never>): string;
    tmdbId(variables: Record<string, never>): string;
    tmdbUrl(variables: Record<string, never>): Url;
    imdbId(variables: Record<string, never>): string | null;
    imdbUrl(variables: Record<string, never>): Url | null;
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
    clipsInstallations(variables: {
        readonly target: ClipsExtensionPoint;
    }): ClipsExtensionInstallation[];
    lists(variables: Record<string, never>): List[];
    subscription(variables: Record<string, never>): SeriesSubscription | null;
    inWatchLater(variables: Record<string, never>): boolean;
    watchThroughs(variables: Record<string, never>): WatchThrough[];
}
export type SeriesStatus = "RETURNING" | "ENDED" | "CANCELLED" | "IN_PRODUCTION";
export interface Season {
    __typename: "Season";
    id(variables: Record<string, never>): string;
    tmdbUrl(variables: Record<string, never>): Url;
    imdbUrl(variables: Record<string, never>): Url;
    series(variables: Record<string, never>): Series;
    number(variables: Record<string, never>): number;
    episodes(variables: Record<string, never>): Episode[];
    episodeCount(variables: Record<string, never>): number;
    firstAired(variables: Record<string, never>): Date | null;
    poster(variables: Record<string, never>): Image | null;
    overview(variables: Record<string, never>): string | null;
    isSpecials(variables: Record<string, never>): boolean;
    isUpcoming(variables: Record<string, never>): boolean;
    isCurrentlyAiring(variables: Record<string, never>): boolean;
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
    hasAired(variables: Record<string, never>): boolean;
    still(variables: Record<string, never>): Image | null;
    overview(variables: Record<string, never>): string | null;
    lists(variables: Record<string, never>): List[];
    watches(variables: Record<string, never>): Watch[];
    skips(variables: Record<string, never>): Skip[];
    latestWatch(variables: Record<string, never>): Watch | null;
    latestSkip(variables: Record<string, never>): Skip | null;
}
export type SeasonStatus = "CONTINUING" | "ENDED";
export interface ClipsExtension {
    __typename: "ClipsExtension";
    id(variables: Record<string, never>): string;
    name(variables: Record<string, never>): string;
    handle(variables: Record<string, never>): string;
    app(variables: Record<string, never>): App;
    latestVersion(variables: Record<string, never>): ClipsExtensionVersion | null;
    versions(variables: Record<string, never>): ClipsExtensionVersion[];
    isInstalled(variables: Record<string, never>): boolean;
}
export interface Icon {
    __typename: "Icon";
    source(variables: Record<string, never>): Url;
}
export type AppExtension = ClipsExtension;
export interface ClipsExtensionVersion {
    __typename: "ClipsExtensionVersion";
    id(variables: Record<string, never>): string;
    status(variables: Record<string, never>): ClipsExtensionVersionStatus;
    assets(variables: Record<string, never>): Asset[];
    apiVersion(variables: Record<string, never>): ClipsExtensionApiVersion;
    extension(variables: Record<string, never>): ClipsExtension;
    extends(variables: Record<string, never>): ClipsExtensionPointSupport[];
    settings(variables: Record<string, never>): ClipsExtensionSettings;
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
    target(variables: Record<string, never>): ClipsExtensionPoint;
    conditions(variables: Record<string, never>): ClipsExtensionPointSupportCondition[];
    liveQuery(variables: Record<string, never>): ClipsLiveQuery | null;
    loading(variables: Record<string, never>): ClipsExtensionPointSupportLoading | null;
}
export interface ClipsExtensionPointSupportCondition {
    __typename: "ClipsExtensionPointSupportCondition";
    series(variables: Record<string, never>): ClipsExtensionPointSupportSeriesCondition | null;
}
export interface ClipsExtensionPointSupportSeriesCondition {
    __typename: "ClipsExtensionPointSupportSeriesCondition";
    handle(variables: Record<string, never>): string | null;
}
export type ClipsLiveQuery = string;
export interface ClipsExtensionPointSupportLoading {
    __typename: "ClipsExtensionPointSupportLoading";
    ui(variables: Record<string, never>): ClipsExtensionPointSupportLoadingUi | null;
}
export interface ClipsExtensionPointSupportLoadingUi {
    __typename: "ClipsExtensionPointSupportLoadingUi";
    tree(variables: Record<string, never>): ClipsLoadingUiTree;
    html(variables: Record<string, never>): ClipsLoadingUiHtml;
}
export type ClipsLoadingUiTree = string;
export type ClipsLoadingUiHtml = string;
export interface ClipsExtensionSettings {
    __typename: "ClipsExtensionSettings";
    fields(variables: Record<string, never>): ClipsExtensionSettingsField[];
}
export type ClipsExtensionSettingsField = ClipsExtensionSettingsStringField | ClipsExtensionSettingsNumberField | ClipsExtensionSettingsOptionsField;
export interface ClipsExtensionSettingsStringField {
    __typename: "ClipsExtensionSettingsStringField";
    key(variables: Record<string, never>): string;
    label(variables: Record<string, never>): ClipsExtensionSettingsString;
    default(variables: Record<string, never>): string | null;
}
export type ClipsExtensionSettingsString = ClipsExtensionSettingsStringTranslation | ClipsExtensionSettingsStringStatic;
export interface ClipsExtensionSettingsStringTranslation {
    __typename: "ClipsExtensionSettingsStringTranslation";
    key(variables: Record<string, never>): TranslationKey;
}
export type TranslationKey = string;
export interface ClipsExtensionSettingsStringStatic {
    __typename: "ClipsExtensionSettingsStringStatic";
    value(variables: Record<string, never>): string;
}
export interface ClipsExtensionSettingsNumberField {
    __typename: "ClipsExtensionSettingsNumberField";
    key(variables: Record<string, never>): string;
    label(variables: Record<string, never>): ClipsExtensionSettingsString;
    default(variables: Record<string, never>): number | null;
}
export interface ClipsExtensionSettingsOptionsField {
    __typename: "ClipsExtensionSettingsOptionsField";
    key(variables: Record<string, never>): string;
    label(variables: Record<string, never>): ClipsExtensionSettingsString;
    default(variables: Record<string, never>): string | null;
    options(variables: Record<string, never>): ClipsExtensionSettingsOptionsFieldOption[];
}
export interface ClipsExtensionSettingsOptionsFieldOption {
    __typename: "ClipsExtensionSettingsOptionsFieldOption";
    value(variables: Record<string, never>): string;
    label(variables: Record<string, never>): ClipsExtensionSettingsString;
}
export type JSON = string;
export interface AppInstallation {
    __typename: "AppInstallation";
    id(variables: Record<string, never>): string;
    app(variables: Record<string, never>): App;
    extensions(variables: Record<string, never>): AppExtensionInstallation[];
}
export type AppExtensionInstallation = ClipsExtensionInstallation;
export interface Mutation {
    __typename: "Mutation";
    createApp(variables: {
        readonly name: string;
        readonly handle?: string | null;
    }): CreateAppPayload;
    deleteApp(variables: {
        readonly id: string;
    }): DeleteAppPayload;
    updateApp(variables: {
        readonly id: string;
        readonly name?: string | null;
    }): UpdateAppPayload;
    createClipsExtension(variables: {
        readonly appId: string;
        readonly name: string;
        readonly handle?: string | null;
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
        readonly id: string;
        readonly code: string;
        readonly name?: string | null;
        readonly extends?: ClipsExtensionPointSupportInput[] | null;
        readonly settings?: ClipsExtensionSettingsInput | null;
        readonly translations?: JSON | null;
    }): PushClipsExtensionPayload;
    publishLatestClipsExtensionVersion(variables: {
        readonly id: string;
    }): PublishClipsExtensionVersionPayload;
    installApp(variables: {
        readonly id: string;
    }): InstallAppPayload;
    installClipsExtension(variables: {
        readonly id: string;
        readonly target?: ClipsExtensionPoint | null;
        readonly settings?: JSON | null;
    }): InstallClipsExtensionPayload;
    uninstallClipsExtension(variables: {
        readonly id: string;
    }): UninstallClipsExtensionPayload;
    updateClipsExtensionInstallation(variables: {
        readonly id: string;
        readonly settings?: JSON | null;
    }): UpdateClipsExtensionInstallationPayload;
    createAccount(variables: {
        readonly email: Email;
        readonly code?: string | null;
        readonly redirectTo?: Url | null;
    }): CreateAccountPayload;
    deleteAccount(variables: Record<string, never>): DeleteAccountPayload;
    createAccountGiftCode(variables: Record<string, never>): CreateAccountGiftCodePayload;
    redeemAccountGiftCode(variables: {
        readonly code: string;
    }): RedeemAccountCodePayload;
    prepareSubscription(variables: {
        readonly level: SubscriptionLevel;
    }): PrepareSubscriptionPayload;
    cancelSubscription(variables: Record<string, never>): CancelSubscriptionPayload;
    signIn(variables: {
        readonly email: Email;
        readonly redirectTo?: Url | null;
    }): SignInPayload;
    signOut(variables: Record<string, never>): SignOutPayload;
    disconnectGithubAccount(variables: Record<string, never>): DisconnectGithubAccountPayload;
    disconnectGoogleAccount(variables: Record<string, never>): DisconnectGoogleAccountPayload;
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
    startPasskeyCreate(variables: Record<string, never>): StartPasskeyCreatePayload;
    finishPasskeyCreate(variables: {
        readonly credential: JSON;
    }): FinishPasskeyCreatePayload;
    deletePasskey(variables: {
        readonly id: string;
    }): DeletePasskeyPayload;
    startPasskeySignIn(variables: {
        readonly email?: string | null;
    }): StartPasskeySignInPayload;
    finishPasskeySignIn(variables: {
        readonly credential: JSON;
    }): FinishPasskeySignInPayload;
    updateSeason(variables: {
        readonly id: string;
        readonly status?: SeasonStatus | null;
    }): UpdateSeasonPayload;
    deleteSeries(variables: {
        readonly id: string;
    }): DeleteSeriesPayload;
    synchronizeSeriesWithTmdb(variables: {
        readonly id: string;
    }): SynchronizeSeriesWithTmdbPayload;
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
    code: string;
    translations?: JSON | null;
    extends?: ClipsExtensionPointSupportInput[] | null;
    settings?: ClipsExtensionSettingsInput | null;
}
export interface CreateClipsExtensionPayload {
    __typename: "CreateClipsExtensionPayload";
    app(variables: Record<string, never>): App | null;
    extension(variables: Record<string, never>): ClipsExtension | null;
    version(variables: Record<string, never>): ClipsExtensionVersion | null;
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
    target: ClipsExtensionPoint;
    liveQuery?: ClipsLiveQuery | null;
    loading?: ClipsExtensionPointSupportLoadingInput | null;
    conditions?: ClipsExtensionPointSupportConditionInput[] | null;
}
export interface ClipsExtensionSettingsInput {
    fields?: ClipsExtensionSettingsFieldInput[] | null;
}
export interface PushClipsExtensionPayload {
    __typename: "PushClipsExtensionPayload";
    extension(variables: Record<string, never>): ClipsExtension | null;
    version(variables: Record<string, never>): ClipsExtensionVersion | null;
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
export interface CreateAccountGiftCodePayload {
    __typename: "CreateAccountGiftCodePayload";
    code(variables: Record<string, never>): string;
}
export interface RedeemAccountCodePayload {
    __typename: "RedeemAccountCodePayload";
    giftCode(variables: Record<string, never>): RedeemedAccountGiftCode | null;
}
export interface PrepareSubscriptionPayload {
    __typename: "PrepareSubscriptionPayload";
    subscription(variables: Record<string, never>): Subscription | null;
}
export interface CancelSubscriptionPayload {
    __typename: "CancelSubscriptionPayload";
    subscription(variables: Record<string, never>): Subscription | null;
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
export interface DisconnectGoogleAccountPayload {
    __typename: "DisconnectGoogleAccountPayload";
    deletedAccountId(variables: Record<string, never>): string | null;
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
export interface StartPasskeyCreatePayload {
    __typename: "StartPasskeyCreatePayload";
    result(variables: Record<string, never>): JSON;
}
export interface FinishPasskeyCreatePayload {
    __typename: "FinishPasskeyCreatePayload";
    passkey(variables: Record<string, never>): Passkey | null;
    user(variables: Record<string, never>): User;
}
export interface DeletePasskeyPayload {
    __typename: "DeletePasskeyPayload";
    deletedPasskeyId(variables: Record<string, never>): string;
    user(variables: Record<string, never>): User;
}
export interface StartPasskeySignInPayload {
    __typename: "StartPasskeySignInPayload";
    result(variables: Record<string, never>): JSON;
}
export interface FinishPasskeySignInPayload {
    __typename: "FinishPasskeySignInPayload";
    user(variables: Record<string, never>): User | null;
    passkey(variables: Record<string, never>): Passkey | null;
}
export interface UpdateSeasonPayload {
    __typename: "UpdateSeasonPayload";
    season(variables: Record<string, never>): Season | null;
}
export interface DeleteSeriesPayload {
    __typename: "DeleteSeriesPayload";
    deletedId(variables: Record<string, never>): string | null;
}
export interface SynchronizeSeriesWithTmdbPayload {
    __typename: "SynchronizeSeriesWithTmdbPayload";
    series(variables: Record<string, never>): Series | null;
}
export interface WatchThrough {
    __typename: "WatchThrough";
    clipsInstallations(variables: {
        readonly target: ClipsExtensionPoint;
    }): ClipsExtensionInstallation[];
    id(variables: Record<string, never>): string;
    url(variables: Record<string, never>): Url;
    series(variables: Record<string, never>): Series;
    from(variables: Record<string, never>): EpisodeSlice;
    to(variables: Record<string, never>): EpisodeSlice;
    on(variables: Record<string, never>): EpisodeDescriptor | null;
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
export interface ClipsExtensionPointSupportSeriesConditionInput {
    id?: string | null;
    handle?: string | null;
}
export interface ClipsExtensionPointSupportLoadingInput {
    ui?: ClipsLoadingUiHtml | null;
}
export interface ClipsExtensionSettingsFieldBase {
    __possibleTypes: ClipsExtensionSettingsStringField | ClipsExtensionSettingsNumberField | ClipsExtensionSettingsOptionsField;
    key(variables: Record<string, never>): string;
    label(variables: Record<string, never>): ClipsExtensionSettingsString;
}
export interface ClipsExtensionSettingsFieldInput {
    string?: ClipsExtensionSettingsStringFieldInput | null;
    number?: ClipsExtensionSettingsNumberFieldInput | null;
    options?: ClipsExtensionSettingsOptionsFieldInput | null;
}
export interface ClipsExtensionSettingsStringFieldInput {
    key: string;
    label: ClipsExtensionSettingsStringInput;
    default?: string | null;
}
export interface ClipsExtensionSettingsNumberFieldInput {
    key: string;
    label: ClipsExtensionSettingsStringInput;
    default?: number | null;
}
export interface ClipsExtensionSettingsOptionsFieldInput {
    key: string;
    label: ClipsExtensionSettingsStringInput;
    default?: string | null;
    options: ClipsExtensionSettingsOptionsFieldOptionInput[];
}
export interface ClipsExtensionSettingsStringInput {
    static?: string | null;
    translation?: TranslationKey | null;
}
export interface ClipsExtensionSettingsOptionsFieldOptionInput {
    value: string;
    label: ClipsExtensionSettingsStringInput;
}
export interface List {
    __typename: "List";
    id(variables: Record<string, never>): string;
    items(variables: Record<string, never>): ListItem[];
}
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
export type ErrorCode = "GENERIC" | "INVALID_SERIES" | "INVALID_EPISODE";
export interface Error {
    __typename: "Error";
    code(variables: Record<string, never>): ErrorCode;
    message(variables: Record<string, never>): string;
}
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
export type WatchThroughStatus = "ONGOING" | "STOPPED" | "FINISHED";
export interface EpisodeDescriptor {
    __typename: "EpisodeDescriptor";
    season(variables: Record<string, never>): number;
    episode(variables: Record<string, never>): number;
}
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
    errors(variables: Record<string, never>): Error[];
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
    ClipsExtensionPointSupportConditionInput: ClipsExtensionPointSupportConditionInput;
    User: User;
    UserRole: UserRole;
    UserLevel: UserLevel;
    GithubAccount: GithubAccount;
    GithubID: GithubID;
    Url: Url;
    Image: Image;
    GoogleAccount: GoogleAccount;
    GoogleID: GoogleID;
    Email: Email;
    Date: Date;
    Passkey: Passkey;
    PersonalAccessToken: PersonalAccessToken;
    UserSettings: UserSettings;
    SpoilerAvoidance: SpoilerAvoidance;
    RedeemedAccountGiftCode: RedeemedAccountGiftCode;
    Subscription: Subscription;
    SubscriptionLevel: SubscriptionLevel;
    SubscriptionStatus: SubscriptionStatus;
    SubscriptionPaymentFlow: SubscriptionPaymentFlow;
    Series: Series;
    SeriesStatus: SeriesStatus;
    Season: Season;
    Episode: Episode;
    SeasonStatus: SeasonStatus;
    ClipsExtension: ClipsExtension;
    Icon: Icon;
    AppExtension: AppExtension;
    ClipsExtensionVersion: ClipsExtensionVersion;
    ClipsExtensionVersionStatus: ClipsExtensionVersionStatus;
    Asset: Asset;
    ClipsExtensionApiVersion: ClipsExtensionApiVersion;
    ClipsExtensionPointSupport: ClipsExtensionPointSupport;
    ClipsExtensionPointSupportCondition: ClipsExtensionPointSupportCondition;
    ClipsExtensionPointSupportSeriesCondition: ClipsExtensionPointSupportSeriesCondition;
    ClipsLiveQuery: ClipsLiveQuery;
    ClipsExtensionPointSupportLoading: ClipsExtensionPointSupportLoading;
    ClipsExtensionPointSupportLoadingUi: ClipsExtensionPointSupportLoadingUi;
    ClipsLoadingUiTree: ClipsLoadingUiTree;
    ClipsLoadingUiHtml: ClipsLoadingUiHtml;
    ClipsExtensionSettings: ClipsExtensionSettings;
    ClipsExtensionSettingsField: ClipsExtensionSettingsField;
    ClipsExtensionSettingsStringField: ClipsExtensionSettingsStringField;
    ClipsExtensionSettingsString: ClipsExtensionSettingsString;
    ClipsExtensionSettingsStringTranslation: ClipsExtensionSettingsStringTranslation;
    TranslationKey: TranslationKey;
    ClipsExtensionSettingsStringStatic: ClipsExtensionSettingsStringStatic;
    ClipsExtensionSettingsNumberField: ClipsExtensionSettingsNumberField;
    ClipsExtensionSettingsOptionsField: ClipsExtensionSettingsOptionsField;
    ClipsExtensionSettingsOptionsFieldOption: ClipsExtensionSettingsOptionsFieldOption;
    JSON: JSON;
    AppInstallation: AppInstallation;
    AppExtensionInstallation: AppExtensionInstallation;
    Mutation: Mutation;
    CreateAppPayload: CreateAppPayload;
    DeleteAppPayload: DeleteAppPayload;
    UpdateAppPayload: UpdateAppPayload;
    CreateClipsInitialVersion: CreateClipsInitialVersion;
    CreateClipsExtensionPayload: CreateClipsExtensionPayload;
    DeleteClipsExtensionPayload: DeleteClipsExtensionPayload;
    UpdateClipsExtensionPayload: UpdateClipsExtensionPayload;
    ClipsExtensionPointSupportInput: ClipsExtensionPointSupportInput;
    ClipsExtensionSettingsInput: ClipsExtensionSettingsInput;
    PushClipsExtensionPayload: PushClipsExtensionPayload;
    PublishClipsExtensionVersionPayload: PublishClipsExtensionVersionPayload;
    InstallAppPayload: InstallAppPayload;
    InstallClipsExtensionPayload: InstallClipsExtensionPayload;
    UninstallClipsExtensionPayload: UninstallClipsExtensionPayload;
    UpdateClipsExtensionInstallationPayload: UpdateClipsExtensionInstallationPayload;
    CreateAccountPayload: CreateAccountPayload;
    DeleteAccountPayload: DeleteAccountPayload;
    CreateAccountGiftCodePayload: CreateAccountGiftCodePayload;
    RedeemAccountCodePayload: RedeemAccountCodePayload;
    PrepareSubscriptionPayload: PrepareSubscriptionPayload;
    CancelSubscriptionPayload: CancelSubscriptionPayload;
    SignInPayload: SignInPayload;
    SignOutPayload: SignOutPayload;
    DisconnectGithubAccountPayload: DisconnectGithubAccountPayload;
    DisconnectGoogleAccountPayload: DisconnectGoogleAccountPayload;
    CreatePersonalAccessTokenPayload: CreatePersonalAccessTokenPayload;
    DeletePersonalAccessTokenPayload: DeletePersonalAccessTokenPayload;
    UpdateUserSettingsPayload: UpdateUserSettingsPayload;
    StartPasskeyCreatePayload: StartPasskeyCreatePayload;
    FinishPasskeyCreatePayload: FinishPasskeyCreatePayload;
    DeletePasskeyPayload: DeletePasskeyPayload;
    StartPasskeySignInPayload: StartPasskeySignInPayload;
    FinishPasskeySignInPayload: FinishPasskeySignInPayload;
    UpdateSeasonPayload: UpdateSeasonPayload;
    DeleteSeriesPayload: DeleteSeriesPayload;
    SynchronizeSeriesWithTmdbPayload: SynchronizeSeriesWithTmdbPayload;
    WatchThrough: WatchThrough;
    ClipsExtensionPointSupportSeriesConditionInput: ClipsExtensionPointSupportSeriesConditionInput;
    ClipsExtensionPointSupportLoadingInput: ClipsExtensionPointSupportLoadingInput;
    ClipsExtensionSettingsFieldBase: ClipsExtensionSettingsFieldBase;
    ClipsExtensionSettingsFieldInput: ClipsExtensionSettingsFieldInput;
    ClipsExtensionSettingsStringFieldInput: ClipsExtensionSettingsStringFieldInput;
    ClipsExtensionSettingsNumberFieldInput: ClipsExtensionSettingsNumberFieldInput;
    ClipsExtensionSettingsOptionsFieldInput: ClipsExtensionSettingsOptionsFieldInput;
    ClipsExtensionSettingsStringInput: ClipsExtensionSettingsStringInput;
    ClipsExtensionSettingsOptionsFieldOptionInput: ClipsExtensionSettingsOptionsFieldOptionInput;
    List: List;
    ListItem: ListItem;
    Listable: Listable;
    AddToListPayload: AddToListPayload;
    RemoveFromListPayload: RemoveFromListPayload;
    EpisodeSliceInput: EpisodeSliceInput;
    EpisodeSlice: EpisodeSlice;
    SearchResults: SearchResults;
    ApiVersion: ApiVersion;
    FormattedText: FormattedText;
    ErrorCode: ErrorCode;
    Error: Error;
    SeriesSubscription: SeriesSubscription;
    SeriesSubscriptionSettings: SeriesSubscriptionSettings;
    SubscribeToSeriesPayload: SubscribeToSeriesPayload;
    UnsubscribeFromSeriesPayload: UnsubscribeFromSeriesPayload;
    UpdateSeriesSubscriptionSettingsPayload: UpdateSeriesSubscriptionSettingsPayload;
    WatchLaterPayload: WatchLaterPayload;
    RemoveFromWatchLaterPayload: RemoveFromWatchLaterPayload;
    Watch: Watch;
    WatchThroughStatus: WatchThroughStatus;
    EpisodeDescriptor: EpisodeDescriptor;
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
declare const schema = "\ntype Query {\n  apps: [App!]!\n  app(id: ID!): App\n  clipsInstallation(id: ID!): ClipsExtensionInstallation\n  clipsInstallations(target: ClipsExtensionPoint, conditions: [ClipsExtensionPointSupportConditionInput!]): [ClipsExtensionInstallation!]!\n  me: User!\n  my: User!\n  series(id: ID, handle: String): Series\n  season(id: ID!): Season\n  randomSeries: Series!\n  lists: [List!]!\n  list(id: ID!): List\n  version: ApiVersion\n  search(query: String!): SearchResults!\n  subscription(id: ID!): SeriesSubscription\n  subscriptions: [SeriesSubscription!]!\n  watchLater: List!\n  watch(id: ID!): Watch\n  watchThrough(id: ID!): WatchThrough\n  watchThroughs(status: WatchThroughStatus): [WatchThrough!]!\n  randomWatchThrough: WatchThrough\n}\n\ntype App {\n  id: ID!\n  name: String!\n  handle: String!\n  icon: Icon\n  extensions: [AppExtension!]!\n  isInstalled: Boolean!\n}\n\ntype ClipsExtensionInstallation {\n  id: ID!\n  extension: ClipsExtension!\n  version: ClipsExtensionVersion!\n  target: ClipsExtensionPoint!\n  appInstallation: AppInstallation!\n  settings: JSON\n  translations: JSON\n  liveQuery: ClipsLiveQuery\n  loading: ClipsExtensionPointSupportLoading\n}\n\nscalar ClipsExtensionPoint\n\ninput ClipsExtensionPointSupportConditionInput {\n  series: ClipsExtensionPointSupportSeriesConditionInput\n}\n\ntype User {\n  id: ID!\n  role: UserRole!\n  level: UserLevel!\n  email: Email!\n  githubAccount: GithubAccount\n  googleAccount: GoogleAccount\n  passkeys: [Passkey!]!\n  accessTokens: [PersonalAccessToken!]!\n  settings: UserSettings!\n  giftCode: RedeemedAccountGiftCode\n  subscription: Subscription\n  apps: [App!]!\n  app(id: ID, handle: String): App\n}\n\nenum UserRole {\n  REGULAR\n  ADMIN\n}\n\nenum UserLevel {\n  FREE\n  MEMBER\n  PATRON\n}\n\ntype GithubAccount {\n  id: GithubID!\n  username: String!\n  profileUrl: Url!\n  avatarImage: Image\n}\n\nscalar GithubID\n\nscalar Url\n\ntype Image {\n  source: Url!\n}\n\ntype GoogleAccount {\n  id: GoogleID!\n  email: Email!\n  image: Image\n  createdAt: Date!\n  updatedAt: Date!\n}\n\nscalar GoogleID\n\nscalar Email\n\nscalar Date\n\ntype Passkey {\n  id: ID!\n}\n\ntype PersonalAccessToken {\n  id: ID!\n  label: String\n  prefix: String!\n  length: Int!\n  createdAt: Date!\n  lastUsedAt: Date\n  lastFourCharacters: String!\n}\n\ntype UserSettings {\n  spoilerAvoidance: SpoilerAvoidance!\n}\n\nenum SpoilerAvoidance {\n  NONE\n  UPCOMING\n  EVERYTHING\n}\n\ntype RedeemedAccountGiftCode {\n  code: String!\n  redeemedAt: Date!\n}\n\ntype Subscription {\n  id: ID!\n  level: SubscriptionLevel!\n  status: SubscriptionStatus!\n  startedAt: Date\n  endedAt: Date\n  paymentFlow: SubscriptionPaymentFlow\n}\n\nenum SubscriptionLevel {\n  MEMBER\n  PATRON\n}\n\nenum SubscriptionStatus {\n  ACTIVE\n  INACTIVE\n}\n\ntype SubscriptionPaymentFlow {\n  apiKey: String!\n  level: SubscriptionLevel!\n  clientSecret: String!\n}\n\ntype Series implements Listable {\n  id: ID!\n  handle: String!\n  tmdbId: ID!\n  tmdbUrl: Url!\n  imdbId: ID\n  imdbUrl: Url\n  name: String!\n  poster: Image\n  overview: String\n  firstAired: Date\n  status: SeriesStatus!\n  seasons: [Season!]!\n  season(number: Int!): Season\n  episodes: [Episode!]!\n  episode(number: Int!, seasonNumber: Int!): Episode\n  clipsInstallations(target: ClipsExtensionPoint!): [ClipsExtensionInstallation!]!\n  lists: [List!]!\n  subscription: SeriesSubscription\n  inWatchLater: Boolean!\n  watchThroughs: [WatchThrough!]!\n}\n\nenum SeriesStatus {\n  RETURNING\n  ENDED\n  CANCELLED\n  IN_PRODUCTION\n}\n\ntype Season implements Listable & Watchable & Skippable {\n  id: ID!\n  tmdbUrl: Url!\n  imdbUrl: Url!\n  series: Series!\n  number: Int!\n  episodes: [Episode!]!\n  episodeCount: Int!\n  firstAired: Date\n  poster: Image\n  overview: String\n  isSpecials: Boolean!\n  isUpcoming: Boolean!\n  isCurrentlyAiring: Boolean!\n  status: SeasonStatus!\n  lists: [List!]!\n  watches: [Watch!]!\n  skips: [Skip!]!\n  latestWatch: Watch\n  latestSkip: Skip\n}\n\ntype Episode implements Listable & Watchable & Skippable {\n  id: ID!\n  title: String!\n  series: Series!\n  season: Season!\n  number: Int!\n  firstAired: Date\n  hasAired: Boolean!\n  still: Image\n  overview: String\n  lists: [List!]!\n  watches: [Watch!]!\n  skips: [Skip!]!\n  latestWatch: Watch\n  latestSkip: Skip\n}\n\nenum SeasonStatus {\n  CONTINUING\n  ENDED\n}\n\ntype ClipsExtension {\n  id: ID!\n  name: String!\n  handle: String!\n  app: App!\n  latestVersion: ClipsExtensionVersion\n  versions: [ClipsExtensionVersion!]!\n  isInstalled: Boolean!\n}\n\ntype Icon {\n  source: Url!\n}\n\nunion AppExtension = ClipsExtension\n\ntype ClipsExtensionVersion {\n  id: ID!\n  status: ClipsExtensionVersionStatus!\n  assets: [Asset!]!\n  apiVersion: ClipsExtensionApiVersion!\n  extension: ClipsExtension!\n  extends: [ClipsExtensionPointSupport!]!\n  settings: ClipsExtensionSettings!\n  translations: JSON\n}\n\nenum ClipsExtensionVersionStatus {\n  PUBLISHED\n  BUILDING\n}\n\ntype Asset {\n  source: Url!\n}\n\nscalar ClipsExtensionApiVersion\n\ntype ClipsExtensionPointSupport {\n  target: ClipsExtensionPoint!\n  conditions: [ClipsExtensionPointSupportCondition!]!\n  liveQuery: ClipsLiveQuery\n  loading: ClipsExtensionPointSupportLoading\n}\n\ntype ClipsExtensionPointSupportCondition {\n  series: ClipsExtensionPointSupportSeriesCondition\n}\n\ntype ClipsExtensionPointSupportSeriesCondition {\n  handle: String\n}\n\nscalar ClipsLiveQuery\n\ntype ClipsExtensionPointSupportLoading {\n  ui: ClipsExtensionPointSupportLoadingUi\n}\n\ntype ClipsExtensionPointSupportLoadingUi {\n  tree: ClipsLoadingUiTree!\n  html: ClipsLoadingUiHtml!\n}\n\nscalar ClipsLoadingUiTree\n\nscalar ClipsLoadingUiHtml\n\ntype ClipsExtensionSettings {\n  fields: [ClipsExtensionSettingsField!]!\n}\n\nunion ClipsExtensionSettingsField = ClipsExtensionSettingsStringField | ClipsExtensionSettingsNumberField | ClipsExtensionSettingsOptionsField\n\ntype ClipsExtensionSettingsStringField implements ClipsExtensionSettingsFieldBase {\n  key: String!\n  label: ClipsExtensionSettingsString!\n  default: String\n}\n\nunion ClipsExtensionSettingsString = ClipsExtensionSettingsStringTranslation | ClipsExtensionSettingsStringStatic\n\ntype ClipsExtensionSettingsStringTranslation {\n  key: TranslationKey!\n}\n\nscalar TranslationKey\n\ntype ClipsExtensionSettingsStringStatic {\n  value: String!\n}\n\ntype ClipsExtensionSettingsNumberField implements ClipsExtensionSettingsFieldBase {\n  key: String!\n  label: ClipsExtensionSettingsString!\n  default: Float\n}\n\ntype ClipsExtensionSettingsOptionsField implements ClipsExtensionSettingsFieldBase {\n  key: String!\n  label: ClipsExtensionSettingsString!\n  default: String\n  options: [ClipsExtensionSettingsOptionsFieldOption!]!\n}\n\ntype ClipsExtensionSettingsOptionsFieldOption {\n  value: String!\n  label: ClipsExtensionSettingsString!\n}\n\nscalar JSON\n\ntype AppInstallation {\n  id: ID!\n  app: App!\n  extensions: [AppExtensionInstallation!]!\n}\n\nunion AppExtensionInstallation = ClipsExtensionInstallation\n\ntype Mutation {\n  createApp(name: String!, handle: String): CreateAppPayload!\n  deleteApp(id: ID!): DeleteAppPayload!\n  updateApp(id: ID!, name: String): UpdateAppPayload!\n  createClipsExtension(appId: ID!, name: String!, handle: String, initialVersion: CreateClipsInitialVersion): CreateClipsExtensionPayload!\n  deleteClipsExtension(id: ID!): DeleteClipsExtensionPayload!\n  updateClipsExtension(id: ID!, name: String): UpdateClipsExtensionPayload!\n  pushClipsExtension(id: ID!, code: String!, name: String, extends: [ClipsExtensionPointSupportInput!], settings: ClipsExtensionSettingsInput, translations: JSON): PushClipsExtensionPayload!\n  publishLatestClipsExtensionVersion(id: ID!): PublishClipsExtensionVersionPayload!\n  installApp(id: ID!): InstallAppPayload!\n  installClipsExtension(id: ID!, target: ClipsExtensionPoint, settings: JSON): InstallClipsExtensionPayload!\n  uninstallClipsExtension(id: ID!): UninstallClipsExtensionPayload!\n  updateClipsExtensionInstallation(id: ID!, settings: JSON): UpdateClipsExtensionInstallationPayload!\n  createAccount(email: Email!, code: String, redirectTo: Url): CreateAccountPayload!\n  deleteAccount: DeleteAccountPayload!\n  createAccountGiftCode: CreateAccountGiftCodePayload!\n  redeemAccountGiftCode(code: String!): RedeemAccountCodePayload!\n  prepareSubscription(level: SubscriptionLevel!): PrepareSubscriptionPayload!\n  cancelSubscription: CancelSubscriptionPayload!\n  signIn(email: Email!, redirectTo: Url): SignInPayload!\n  signOut: SignOutPayload!\n  disconnectGithubAccount: DisconnectGithubAccountPayload!\n  disconnectGoogleAccount: DisconnectGoogleAccountPayload!\n  createPersonalAccessToken(label: String): CreatePersonalAccessTokenPayload!\n  deletePersonalAccessToken(id: ID, token: String): DeletePersonalAccessTokenPayload!\n  updateUserSettings(spoilerAvoidance: SpoilerAvoidance): UpdateUserSettingsPayload!\n  startPasskeyCreate: StartPasskeyCreatePayload!\n  finishPasskeyCreate(credential: JSON!): FinishPasskeyCreatePayload!\n  deletePasskey(id: ID!): DeletePasskeyPayload!\n  startPasskeySignIn(email: String): StartPasskeySignInPayload!\n  finishPasskeySignIn(credential: JSON!): FinishPasskeySignInPayload!\n  updateSeason(id: ID!, status: SeasonStatus): UpdateSeasonPayload!\n  deleteSeries(id: ID!): DeleteSeriesPayload!\n  synchronizeSeriesWithTmdb(id: ID!): SynchronizeSeriesWithTmdbPayload!\n  addToList(id: ID!, seriesId: ID): AddToListPayload!\n  removeFromList(id: ID!, itemId: ID!): RemoveFromListPayload!\n  ping: Boolean!\n  subscribeToSeries(id: ID!, spoilerAvoidance: SpoilerAvoidance): SubscribeToSeriesPayload!\n  unsubscribeFromSeries(id: ID!): UnsubscribeFromSeriesPayload!\n  updateSeriesSubscriptionSettings(id: ID!, spoilerAvoidance: SpoilerAvoidance!): UpdateSeriesSubscriptionSettingsPayload!\n  watchLater(seriesId: ID): WatchLaterPayload!\n  removeFromWatchLater(seriesId: ID): RemoveFromWatchLaterPayload!\n  skipEpisode(episode: ID!, watchThrough: ID, notes: NotesInput, at: Date, updateWatchLater: Boolean): SkipEpisodePayload!\n  watchEpisode(episode: ID!, watchThrough: ID, rating: Int, notes: NotesInput, startedAt: Date, finishedAt: Date, updateWatchLater: Boolean): WatchEpisodePayload!\n  watchEpisodesFromSeries(series: ID!, from: EpisodeSliceInput, to: EpisodeSliceInput, updateWatchLater: Boolean): WatchEpisodesFromSeriesPayload!\n  startWatchThrough(series: ID!, from: EpisodeSliceInput, to: EpisodeSliceInput, includeSpecials: Boolean, spoilerAvoidance: SpoilerAvoidance, updateWatchLater: Boolean): StartWatchThroughPayload!\n  stopWatchThrough(id: ID!, watchLater: Boolean): StopWatchThroughPayload!\n  deleteWatchThrough(id: ID!, watchLater: Boolean): DeleteWatchThroughPayload!\n  updateWatchThroughSettings(id: ID!, spoilerAvoidance: SpoilerAvoidance): UpdateWatchThroughSettingsPayload!\n  deleteWatch(id: ID!): DeleteWatchPayload!\n}\n\ntype CreateAppPayload {\n  app: App\n}\n\ntype DeleteAppPayload {\n  deletedId: ID\n}\n\ntype UpdateAppPayload {\n  app: App\n}\n\ninput CreateClipsInitialVersion {\n  code: String!\n  translations: JSON\n  extends: [ClipsExtensionPointSupportInput!]\n  settings: ClipsExtensionSettingsInput\n}\n\ntype CreateClipsExtensionPayload {\n  app: App\n  extension: ClipsExtension\n  version: ClipsExtensionVersion\n}\n\ntype DeleteClipsExtensionPayload {\n  app: App\n  deletedId: ID\n}\n\ntype UpdateClipsExtensionPayload {\n  app: App\n  extension: ClipsExtension\n}\n\ninput ClipsExtensionPointSupportInput {\n  target: ClipsExtensionPoint!\n  liveQuery: ClipsLiveQuery\n  loading: ClipsExtensionPointSupportLoadingInput\n  conditions: [ClipsExtensionPointSupportConditionInput!]\n}\n\ninput ClipsExtensionSettingsInput {\n  fields: [ClipsExtensionSettingsFieldInput!]\n}\n\ntype PushClipsExtensionPayload {\n  extension: ClipsExtension\n  version: ClipsExtensionVersion\n}\n\ntype PublishClipsExtensionVersionPayload {\n  extension: ClipsExtension\n  version: ClipsExtensionVersion\n}\n\ntype InstallAppPayload {\n  app: App\n  installation: AppInstallation\n}\n\ntype InstallClipsExtensionPayload {\n  extension: ClipsExtension\n  installation: ClipsExtensionInstallation\n}\n\ntype UninstallClipsExtensionPayload {\n  extension: ClipsExtension\n  deletedInstallationId: ID\n}\n\ntype UpdateClipsExtensionInstallationPayload {\n  extension: ClipsExtension\n  installation: ClipsExtensionInstallation\n}\n\ntype CreateAccountPayload {\n  email: Email!\n}\n\ntype DeleteAccountPayload {\n  deletedId: ID!\n}\n\ntype CreateAccountGiftCodePayload {\n  code: String!\n}\n\ntype RedeemAccountCodePayload {\n  giftCode: RedeemedAccountGiftCode\n}\n\ntype PrepareSubscriptionPayload {\n  subscription: Subscription\n}\n\ntype CancelSubscriptionPayload {\n  subscription: Subscription\n}\n\ntype SignInPayload {\n  email: Email!\n}\n\ntype SignOutPayload {\n  userId: ID!\n}\n\ntype DisconnectGithubAccountPayload {\n  deletedAccount: GithubAccount\n}\n\ntype DisconnectGoogleAccountPayload {\n  deletedAccountId: ID\n}\n\ntype CreatePersonalAccessTokenPayload {\n  plaintextToken: String\n  personalAccessToken: PersonalAccessToken\n}\n\ntype DeletePersonalAccessTokenPayload {\n  deletedPersonalAccessTokenId: ID\n}\n\ntype UpdateUserSettingsPayload {\n  user: User!\n}\n\ntype StartPasskeyCreatePayload {\n  result: JSON!\n}\n\ntype FinishPasskeyCreatePayload {\n  passkey: Passkey\n  user: User!\n}\n\ntype DeletePasskeyPayload {\n  deletedPasskeyId: ID!\n  user: User!\n}\n\ntype StartPasskeySignInPayload {\n  result: JSON!\n}\n\ntype FinishPasskeySignInPayload {\n  user: User\n  passkey: Passkey\n}\n\ntype UpdateSeasonPayload {\n  season: Season\n}\n\ntype DeleteSeriesPayload {\n  deletedId: ID\n}\n\ntype SynchronizeSeriesWithTmdbPayload {\n  series: Series\n}\n\ntype WatchThrough {\n  clipsInstallations(target: ClipsExtensionPoint!): [ClipsExtensionInstallation!]!\n  id: ID!\n  url: Url!\n  series: Series!\n  from: EpisodeSlice!\n  to: EpisodeSlice!\n  on: EpisodeDescriptor\n  startedAt: Date\n  createdAt: Date!\n  updatedAt: Date!\n  finishedAt: Date\n  status: WatchThroughStatus!\n  watches: [Watch!]!\n  actions: [Action!]!\n  nextEpisode: Episode\n  unfinishedEpisodeCount: Int!\n  settings: WatchThroughSettings!\n}\n\ninput ClipsExtensionPointSupportSeriesConditionInput {\n  id: ID\n  handle: String\n}\n\ninput ClipsExtensionPointSupportLoadingInput {\n  ui: ClipsLoadingUiHtml\n}\n\ninterface ClipsExtensionSettingsFieldBase {\n  key: String!\n  label: ClipsExtensionSettingsString!\n}\n\ninput ClipsExtensionSettingsFieldInput {\n  string: ClipsExtensionSettingsStringFieldInput\n  number: ClipsExtensionSettingsNumberFieldInput\n  options: ClipsExtensionSettingsOptionsFieldInput\n}\n\ninput ClipsExtensionSettingsStringFieldInput {\n  key: String!\n  label: ClipsExtensionSettingsStringInput!\n  default: String\n}\n\ninput ClipsExtensionSettingsNumberFieldInput {\n  key: String!\n  label: ClipsExtensionSettingsStringInput!\n  default: Float\n}\n\ninput ClipsExtensionSettingsOptionsFieldInput {\n  key: String!\n  label: ClipsExtensionSettingsStringInput!\n  default: String\n  options: [ClipsExtensionSettingsOptionsFieldOptionInput!]!\n}\n\ninput ClipsExtensionSettingsStringInput {\n  static: String\n  translation: TranslationKey\n}\n\ninput ClipsExtensionSettingsOptionsFieldOptionInput {\n  value: String!\n  label: ClipsExtensionSettingsStringInput!\n}\n\ntype List {\n  id: ID!\n  items: [ListItem!]!\n}\n\ntype ListItem {\n  id: ID!\n  position: Int!\n  media: Listable!\n}\n\ninterface Listable {\n  id: ID!\n  lists: [List!]!\n}\n\ntype AddToListPayload {\n  list: List\n  item: ListItem\n  series: Series\n}\n\ntype RemoveFromListPayload {\n  list: List\n  series: Series\n  removedListItemId: ID\n}\n\ninput EpisodeSliceInput {\n  season: Int!\n  episode: Int\n}\n\ntype EpisodeSlice {\n  season: Int!\n  episode: Int\n}\n\ntype SearchResults {\n  series: [Series!]!\n}\n\nscalar ApiVersion\n\nscalar FormattedText\n\nenum ErrorCode {\n  GENERIC\n  INVALID_SERIES\n  INVALID_EPISODE\n}\n\ntype Error {\n  code: ErrorCode!\n  message: String!\n}\n\ntype SeriesSubscription {\n  id: ID!\n  series: Series!\n  subscribedOn: Date!\n  settings: SeriesSubscriptionSettings!\n}\n\ntype SeriesSubscriptionSettings {\n  spoilerAvoidance: SpoilerAvoidance!\n}\n\ntype SubscribeToSeriesPayload {\n  subscription: SeriesSubscription\n}\n\ntype UnsubscribeFromSeriesPayload {\n  deletedSubscriptionId: ID!\n}\n\ntype UpdateSeriesSubscriptionSettingsPayload {\n  subscription: SeriesSubscription\n}\n\ntype WatchLaterPayload {\n  list: List!\n  item: ListItem\n  series: Series\n}\n\ntype RemoveFromWatchLaterPayload {\n  list: List!\n  series: Series\n  removedListItemId: ID\n}\n\ntype Watch {\n  id: ID!\n  media: Watchable!\n  startedAt: Date\n  finishedAt: Date\n  createdAt: Date!\n  updatedAt: Date!\n  rating: Int\n  notes: Notes\n  watchThrough: WatchThrough\n}\n\nenum WatchThroughStatus {\n  ONGOING\n  STOPPED\n  FINISHED\n}\n\ntype EpisodeDescriptor {\n  season: Int!\n  episode: Int!\n}\n\nunion Action = Watch | Skip\n\ninterface Watchable {\n  id: ID!\n  watches: [Watch!]!\n  latestWatch: Watch\n}\n\ntype Notes {\n  content: FormattedText!\n  containsSpoilers: Boolean!\n}\n\ntype Skip {\n  id: ID!\n  at: Date\n  createdAt: Date!\n  updatedAt: Date!\n  media: Skippable!\n  notes: Notes\n  watchThrough: WatchThrough\n}\n\ninterface Skippable {\n  id: ID!\n  skips: [Skip!]!\n  latestSkip: Skip\n}\n\ntype WatchThroughSettings {\n  spoilerAvoidance: SpoilerAvoidance!\n}\n\ninput NotesInput {\n  content: FormattedText!\n  containsSpoilers: Boolean!\n}\n\ntype SkipEpisodePayload {\n  skip: Skip\n  episode: Episode\n  watchThrough: WatchThrough\n  watchLater: List!\n}\n\ntype WatchEpisodePayload {\n  watch: Watch\n  episode: Episode\n  watchThrough: WatchThrough\n  watchLater: List!\n}\n\ntype WatchEpisodesFromSeriesPayload {\n  series: Series\n  watchLater: List!\n}\n\ntype StartWatchThroughPayload {\n  errors: [Error!]!\n  watchThrough: WatchThrough\n  watchLater: List!\n}\n\ntype StopWatchThroughPayload {\n  watchThrough: WatchThrough\n  watchLater: List!\n}\n\ntype DeleteWatchThroughPayload {\n  deletedWatchThroughId: ID!\n  watchLater: List!\n}\n\ntype UpdateWatchThroughSettingsPayload {\n  watchThrough: WatchThrough\n}\n\ntype DeleteWatchPayload {\n  deletedWatchId: ID!\n  watchThrough: WatchThrough\n}\n";
export default schema;
//# sourceMappingURL=schema.d.ts.map