export type Url = string;
export type Date = string;
export type Version = string;
export type ExtensionPoint = string;
export type ExtensionApiVersion = string;
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
export interface ClipsExtensionPointSeriesCondition {
  __typename: "ClipsExtensionPointSeriesCondition";
  handle(variables: Record<string, never>): string | null;
}
export interface ClipsExtensionPointCondition {
  __typename: "ClipsExtensionPointCondition";
  series(variables: Record<string, never>): ClipsExtensionPointSeriesCondition | null;
}
export interface ClipsExtensionPointSupport {
  __typename: "ClipsExtensionPointSupport";
  name(variables: Record<string, never>): ClipsExtensionPoint;
  module(variables: Record<string, never>): string;
  conditions(variables: Record<string, never>): ClipsExtensionPointCondition[];
}
export interface ClipsExtension {
  __typename: "ClipsExtension";
  id(variables: Record<string, never>): string;
  name(variables: Record<string, never>): string;
  handle(variables: Record<string, never>): string;
  build(variables: Record<string, never>): ExtensionBuild;
  supports(variables: Record<string, never>): ClipsExtensionPointSupport[];
}
export type Extension = ClipsExtension;
export interface App {
  __typename: "App";
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
  Asset: Asset;
  BuildError: BuildError;
  ExtensionBuildInProgress: ExtensionBuildInProgress;
  ExtensionBuildSuccess: ExtensionBuildSuccess;
  ExtensionBuildError: ExtensionBuildError;
  ExtensionBuild: ExtensionBuild;
  ClipsExtensionPoint: ClipsExtensionPoint;
  ClipsExtensionPointSeriesCondition: ClipsExtensionPointSeriesCondition;
  ClipsExtensionPointCondition: ClipsExtensionPointCondition;
  ClipsExtensionPointSupport: ClipsExtensionPointSupport;
  ClipsExtension: ClipsExtension;
  Extension: Extension;
  App: App;
  Query: Query;
}
const schema = `
scalar Url

scalar Date

scalar Version

scalar ExtensionPoint

scalar ExtensionApiVersion

type Asset {
  source: Url!
}

type BuildError {
  message: String!
  stack: String
}

type ExtensionBuildInProgress {
  id: ID!
  startedAt: Date!
}

type ExtensionBuildSuccess {
  id: ID!
  finishedAt: Date!
  startedAt: Date!
  duration: Int!
  assets: [Asset!]!
}

type ExtensionBuildError {
  id: ID!
  error: BuildError!
  finishedAt: Date!
  duration: Int!
  startedAt: Date!
}

union ExtensionBuild = ExtensionBuildInProgress | ExtensionBuildSuccess | ExtensionBuildError

scalar ClipsExtensionPoint

type ClipsExtensionPointSeriesCondition {
  handle: String
}

type ClipsExtensionPointCondition {
  series: ClipsExtensionPointSeriesCondition
}

type ClipsExtensionPointSupport {
  name: ClipsExtensionPoint!
  module: String!
  conditions: [ClipsExtensionPointCondition!]!
}

type ClipsExtension {
  id: ID!
  name: String!
  handle: String!
  build: ExtensionBuild!
  supports: [ClipsExtensionPointSupport!]!
}

union Extension = ClipsExtension

type App {
  name: String!
  handle: String!
  extensions: [Extension!]!
  extension(id: ID!): Extension
  clipsExtension(id: ID!): ClipsExtension
}

type Query {
  version: Version!
  app: App!
}
`;
export default schema;