export type Url = string;
export type Date = string;
export type Version = string;
export type ExtensionPoint = string;
export type ExtensionApiVersion = string;
export type ExtensionLoadingUiTree = string;
export type ExtensionLoadingUiHtml = string;
export interface Asset {
    __typename: "Asset";
    source(variables: Record<string, never>): Url;
}
export interface BuildError {
    __typename: "BuildError";
    message(variables: Record<string, never>): string;
    stack(variables: Record<string, never>): string | null;
}
export interface ExtensionBuildInProgress {
    __typename: "ExtensionBuildInProgress";
    id(variables: Record<string, never>): string;
    startedAt(variables: Record<string, never>): Date;
}
export interface ExtensionBuildSuccess {
    __typename: "ExtensionBuildSuccess";
    id(variables: Record<string, never>): string;
    finishedAt(variables: Record<string, never>): Date;
    startedAt(variables: Record<string, never>): Date;
    duration(variables: Record<string, never>): number;
    assets(variables: Record<string, never>): Asset[];
}
export interface ExtensionBuildError {
    __typename: "ExtensionBuildError";
    id(variables: Record<string, never>): string;
    error(variables: Record<string, never>): BuildError;
    finishedAt(variables: Record<string, never>): Date;
    duration(variables: Record<string, never>): number;
    startedAt(variables: Record<string, never>): Date;
}
export type ExtensionBuild = ExtensionBuildInProgress | ExtensionBuildSuccess | ExtensionBuildError;
export type ClipsExtensionPoint = string;
export interface ClipsExtensionPointSupportSeriesCondition {
    __typename: "ClipsExtensionPointSupportSeriesCondition";
    handle(variables: Record<string, never>): string | null;
}
export interface ClipsExtensionPointSupportCondition {
    __typename: "ClipsExtensionPointSupportCondition";
    series(variables: Record<string, never>): ClipsExtensionPointSupportSeriesCondition | null;
}
export interface ClipsExtensionPointPreview {
    __typename: "ClipsExtensionPointPreview";
    url(variables: {
        readonly connect?: boolean | null;
    }): Url;
}
export interface ClipsExtensionPointLiveQuery {
    __typename: "ClipsExtensionPointLiveQuery";
    file(variables: Record<string, never>): string;
    query(variables: Record<string, never>): string;
}
export interface ClipsExtensionPointLoadingUi {
    __typename: "ClipsExtensionPointLoadingUi";
    file(variables: Record<string, never>): string | null;
    tree(variables: Record<string, never>): ExtensionLoadingUiTree | null;
    html(variables: Record<string, never>): ExtensionLoadingUiHtml | null;
}
export interface ClipsExtensionPointLoading {
    __typename: "ClipsExtensionPointLoading";
    ui(variables: Record<string, never>): ClipsExtensionPointLoadingUi | null;
}
export interface ClipsExtensionPointSupport {
    __typename: "ClipsExtensionPointSupport";
    target(variables: Record<string, never>): ClipsExtensionPoint;
    module(variables: Record<string, never>): string;
    liveQuery(variables: Record<string, never>): ClipsExtensionPointLiveQuery | null;
    loading(variables: Record<string, never>): ClipsExtensionPointLoading | null;
    preview(variables: Record<string, never>): ClipsExtensionPointPreview;
    conditions(variables: Record<string, never>): ClipsExtensionPointSupportCondition[];
}
export interface ClipsExtension {
    __typename: "ClipsExtension";
    id(variables: Record<string, never>): string;
    name(variables: Record<string, never>): string;
    handle(variables: Record<string, never>): string;
    build(variables: Record<string, never>): ExtensionBuild;
    extends(variables: Record<string, never>): ClipsExtensionPointSupport[];
}
export type Extension = ClipsExtension;
export interface App {
    __typename: "App";
    id(variables: Record<string, never>): string;
    name(variables: Record<string, never>): string;
    handle(variables: Record<string, never>): string;
    extensions(variables: Record<string, never>): Extension[];
    extension(variables: {
        readonly id: string;
    }): Extension | null;
    clipsExtension(variables: {
        readonly id: string;
    }): ClipsExtension | null;
}
export interface Query {
    __typename: "Query";
    version(variables: Record<string, never>): Version;
    app(variables: Record<string, never>): App;
}
export interface Schema {
    Url: Url;
    Date: Date;
    Version: Version;
    ExtensionPoint: ExtensionPoint;
    ExtensionApiVersion: ExtensionApiVersion;
    ExtensionLoadingUiTree: ExtensionLoadingUiTree;
    ExtensionLoadingUiHtml: ExtensionLoadingUiHtml;
    Asset: Asset;
    BuildError: BuildError;
    ExtensionBuildInProgress: ExtensionBuildInProgress;
    ExtensionBuildSuccess: ExtensionBuildSuccess;
    ExtensionBuildError: ExtensionBuildError;
    ExtensionBuild: ExtensionBuild;
    ClipsExtensionPoint: ClipsExtensionPoint;
    ClipsExtensionPointSupportSeriesCondition: ClipsExtensionPointSupportSeriesCondition;
    ClipsExtensionPointSupportCondition: ClipsExtensionPointSupportCondition;
    ClipsExtensionPointPreview: ClipsExtensionPointPreview;
    ClipsExtensionPointLiveQuery: ClipsExtensionPointLiveQuery;
    ClipsExtensionPointLoadingUi: ClipsExtensionPointLoadingUi;
    ClipsExtensionPointLoading: ClipsExtensionPointLoading;
    ClipsExtensionPointSupport: ClipsExtensionPointSupport;
    ClipsExtension: ClipsExtension;
    Extension: Extension;
    App: App;
    Query: Query;
}
declare const schema = "\nscalar Url\n\nscalar Date\n\nscalar Version\n\nscalar ExtensionPoint\n\nscalar ExtensionApiVersion\n\nscalar ExtensionLoadingUiTree\n\nscalar ExtensionLoadingUiHtml\n\ntype Asset {\n  source: Url!\n}\n\ntype BuildError {\n  message: String!\n  stack: String\n}\n\ntype ExtensionBuildInProgress {\n  id: ID!\n  startedAt: Date!\n}\n\ntype ExtensionBuildSuccess {\n  id: ID!\n  finishedAt: Date!\n  startedAt: Date!\n  duration: Int!\n  assets: [Asset!]!\n}\n\ntype ExtensionBuildError {\n  id: ID!\n  error: BuildError!\n  finishedAt: Date!\n  duration: Int!\n  startedAt: Date!\n}\n\nunion ExtensionBuild = ExtensionBuildInProgress | ExtensionBuildSuccess | ExtensionBuildError\n\nscalar ClipsExtensionPoint\n\ntype ClipsExtensionPointSupportSeriesCondition {\n  handle: String\n}\n\ntype ClipsExtensionPointSupportCondition {\n  series: ClipsExtensionPointSupportSeriesCondition\n}\n\ntype ClipsExtensionPointPreview {\n  url(connect: Boolean): Url!\n}\n\ntype ClipsExtensionPointLiveQuery {\n  file: String!\n  query: String!\n}\n\ntype ClipsExtensionPointLoadingUi {\n  file: String\n  tree: ExtensionLoadingUiTree\n  html: ExtensionLoadingUiHtml\n}\n\ntype ClipsExtensionPointLoading {\n  ui: ClipsExtensionPointLoadingUi\n}\n\ntype ClipsExtensionPointSupport {\n  target: ClipsExtensionPoint!\n  module: String!\n  liveQuery: ClipsExtensionPointLiveQuery\n  loading: ClipsExtensionPointLoading\n  preview: ClipsExtensionPointPreview!\n  conditions: [ClipsExtensionPointSupportCondition!]!\n}\n\ntype ClipsExtension {\n  id: ID!\n  name: String!\n  handle: String!\n  build: ExtensionBuild!\n  extends: [ClipsExtensionPointSupport!]!\n}\n\nunion Extension = ClipsExtension\n\ntype App {\n  id: ID!\n  name: String!\n  handle: String!\n  extensions: [Extension!]!\n  extension(id: ID!): Extension\n  clipsExtension(id: ID!): ClipsExtension\n}\n\ntype Query {\n  version: Version!\n  app: App!\n}\n";
export default schema;
//# sourceMappingURL=schema.d.ts.map