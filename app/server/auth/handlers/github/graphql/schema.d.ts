export interface AcceptEnterpriseAdministratorInvitationInput {
  invitationId: string;
  clientMutationId?: string | null;
}
export interface AcceptTopicSuggestionInput {
  repositoryId: string;
  name: string;
  clientMutationId?: string | null;
}
export interface AddAssigneesToAssignableInput {
  assignableId: string;
  assigneeIds: string[];
  clientMutationId?: string | null;
}
export interface AddCommentInput {
  subjectId: string;
  body: string;
  clientMutationId?: string | null;
}
export interface AddEnterpriseSupportEntitlementInput {
  enterpriseId: string;
  login: string;
  clientMutationId?: string | null;
}
export interface AddLabelsToLabelableInput {
  labelableId: string;
  labelIds: string[];
  clientMutationId?: string | null;
}
export interface AddProjectCardInput {
  projectColumnId: string;
  contentId?: string | null;
  note?: string | null;
  clientMutationId?: string | null;
}
export interface AddProjectColumnInput {
  projectId: string;
  name: string;
  clientMutationId?: string | null;
}
export interface AddPullRequestReviewCommentInput {
  pullRequestId?: string | null;
  pullRequestReviewId?: string | null;
  commitOID?: GitObjectID | null;
  body: string;
  path?: string | null;
  position?: number | null;
  inReplyTo?: string | null;
  clientMutationId?: string | null;
}
export interface AddPullRequestReviewInput {
  pullRequestId: string;
  commitOID?: GitObjectID | null;
  body?: string | null;
  event?: PullRequestReviewEvent | null;
  comments?: (DraftPullRequestReviewComment | null)[] | null;
  threads?: (DraftPullRequestReviewThread | null)[] | null;
  clientMutationId?: string | null;
}
export interface AddPullRequestReviewThreadInput {
  path: string;
  body: string;
  pullRequestId?: string | null;
  pullRequestReviewId?: string | null;
  line: number;
  side?: DiffSide | null;
  startLine?: number | null;
  startSide?: DiffSide | null;
  clientMutationId?: string | null;
}
export interface AddReactionInput {
  subjectId: string;
  content: ReactionContent;
  clientMutationId?: string | null;
}
export interface AddStarInput {
  starrableId: string;
  clientMutationId?: string | null;
}
export interface AddVerifiableDomainInput {
  ownerId: string;
  domain: URI;
  clientMutationId?: string | null;
}
export interface ApproveVerifiableDomainInput {
  id: string;
  clientMutationId?: string | null;
}
export interface ArchiveRepositoryInput {
  repositoryId: string;
  clientMutationId?: string | null;
}
export interface AuditLogOrder {
  field?: AuditLogOrderField | null;
  direction?: OrderDirection | null;
}
export type AuditLogOrderField = "CREATED_AT";
export interface CancelEnterpriseAdminInvitationInput {
  invitationId: string;
  clientMutationId?: string | null;
}
export interface ChangeUserStatusInput {
  emoji?: string | null;
  message?: string | null;
  organizationId?: string | null;
  limitedAvailability?: boolean | null;
  expiresAt?: DateTime | null;
  clientMutationId?: string | null;
}
export interface CheckAnnotationData {
  path: string;
  location: CheckAnnotationRange;
  annotationLevel: CheckAnnotationLevel;
  message: string;
  title?: string | null;
  rawDetails?: string | null;
}
export type CheckAnnotationLevel = "FAILURE" | "NOTICE" | "WARNING";
export interface CheckAnnotationRange {
  startLine: number;
  startColumn?: number | null;
  endLine: number;
  endColumn?: number | null;
}
export type CheckConclusionState = "ACTION_REQUIRED" | "TIMED_OUT" | "CANCELLED" | "FAILURE" | "SUCCESS" | "NEUTRAL" | "SKIPPED" | "STARTUP_FAILURE" | "STALE";
export interface CheckRunAction {
  label: string;
  description: string;
  identifier: string;
}
export interface CheckRunFilter {
  checkType?: CheckRunType | null;
  appId?: number | null;
  checkName?: string | null;
  status?: CheckStatusState | null;
}
export interface CheckRunOutput {
  title: string;
  summary: string;
  text?: string | null;
  annotations?: CheckAnnotationData[] | null;
  images?: CheckRunOutputImage[] | null;
}
export interface CheckRunOutputImage {
  alt: string;
  imageUrl: URI;
  caption?: string | null;
}
export type CheckRunType = "ALL" | "LATEST";
export type CheckStatusState = "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "WAITING" | "REQUESTED";
export interface CheckSuiteAutoTriggerPreference {
  appId: string;
  setting: boolean;
}
export interface CheckSuiteFilter {
  appId?: number | null;
  checkName?: string | null;
}
export interface ClearLabelsFromLabelableInput {
  labelableId: string;
  clientMutationId?: string | null;
}
export interface CloneProjectInput {
  targetOwnerId: string;
  sourceId: string;
  includeWorkflows: boolean;
  name: string;
  body?: string | null;
  public?: boolean | null;
  clientMutationId?: string | null;
}
export interface CloneTemplateRepositoryInput {
  repositoryId: string;
  name: string;
  ownerId: string;
  description?: string | null;
  visibility: RepositoryVisibility;
  includeAllBranches?: boolean | null;
  clientMutationId?: string | null;
}
export interface CloseIssueInput {
  issueId: string;
  clientMutationId?: string | null;
}
export interface ClosePullRequestInput {
  pullRequestId: string;
  clientMutationId?: string | null;
}
export type CollaboratorAffiliation = "OUTSIDE" | "DIRECT" | "ALL";
export type CommentAuthorAssociation = "MEMBER" | "OWNER" | "MANNEQUIN" | "COLLABORATOR" | "CONTRIBUTOR" | "FIRST_TIME_CONTRIBUTOR" | "FIRST_TIMER" | "NONE";
export type CommentCannotUpdateReason = "ARCHIVED" | "INSUFFICIENT_ACCESS" | "LOCKED" | "LOGIN_REQUIRED" | "MAINTENANCE" | "VERIFIED_EMAIL_REQUIRED" | "DENIED";
export interface CommitAuthor {
  id?: string | null;
  emails?: string[] | null;
}
export interface CommitContributionOrder {
  field: CommitContributionOrderField;
  direction: OrderDirection;
}
export type CommitContributionOrderField = "OCCURRED_AT" | "COMMIT_COUNT";
export type ContributionLevel = "NONE" | "FIRST_QUARTILE" | "SECOND_QUARTILE" | "THIRD_QUARTILE" | "FOURTH_QUARTILE";
export interface ContributionOrder {
  direction: OrderDirection;
}
export interface ConvertProjectCardNoteToIssueInput {
  projectCardId: string;
  repositoryId: string;
  title?: string | null;
  body?: string | null;
  clientMutationId?: string | null;
}
export interface CreateBranchProtectionRuleInput {
  repositoryId: string;
  pattern: string;
  requiresApprovingReviews?: boolean | null;
  requiredApprovingReviewCount?: number | null;
  requiresCommitSignatures?: boolean | null;
  requiresLinearHistory?: boolean | null;
  allowsForcePushes?: boolean | null;
  allowsDeletions?: boolean | null;
  isAdminEnforced?: boolean | null;
  requiresStatusChecks?: boolean | null;
  requiresStrictStatusChecks?: boolean | null;
  requiresCodeOwnerReviews?: boolean | null;
  dismissesStaleReviews?: boolean | null;
  restrictsReviewDismissals?: boolean | null;
  reviewDismissalActorIds?: string[] | null;
  restrictsPushes?: boolean | null;
  pushActorIds?: string[] | null;
  requiredStatusCheckContexts?: string[] | null;
  clientMutationId?: string | null;
}
export interface CreateCheckRunInput {
  repositoryId: string;
  name: string;
  headSha: GitObjectID;
  detailsUrl?: URI | null;
  externalId?: string | null;
  status?: RequestableCheckStatusState | null;
  startedAt?: DateTime | null;
  conclusion?: CheckConclusionState | null;
  completedAt?: DateTime | null;
  output?: CheckRunOutput | null;
  actions?: CheckRunAction[] | null;
  clientMutationId?: string | null;
}
export interface CreateCheckSuiteInput {
  repositoryId: string;
  headSha: GitObjectID;
  clientMutationId?: string | null;
}
export interface CreateEnterpriseOrganizationInput {
  enterpriseId: string;
  login: string;
  profileName: string;
  billingEmail: string;
  adminLogins: string[];
  clientMutationId?: string | null;
}
export interface CreateIpAllowListEntryInput {
  ownerId: string;
  allowListValue: string;
  name?: string | null;
  isActive: boolean;
  clientMutationId?: string | null;
}
export interface CreateIssueInput {
  repositoryId: string;
  title: string;
  body?: string | null;
  assigneeIds?: string[] | null;
  milestoneId?: string | null;
  labelIds?: string[] | null;
  projectIds?: string[] | null;
  issueTemplate?: string | null;
  clientMutationId?: string | null;
}
export interface CreateProjectInput {
  ownerId: string;
  name: string;
  body?: string | null;
  template?: ProjectTemplate | null;
  repositoryIds?: string[] | null;
  clientMutationId?: string | null;
}
export interface CreatePullRequestInput {
  repositoryId: string;
  baseRefName: string;
  headRefName: string;
  title: string;
  body?: string | null;
  maintainerCanModify?: boolean | null;
  draft?: boolean | null;
  clientMutationId?: string | null;
}
export interface CreateRefInput {
  repositoryId: string;
  name: string;
  oid: GitObjectID;
  clientMutationId?: string | null;
}
export interface CreateRepositoryInput {
  name: string;
  ownerId?: string | null;
  description?: string | null;
  visibility: RepositoryVisibility;
  template?: boolean | null;
  homepageUrl?: URI | null;
  hasWikiEnabled?: boolean | null;
  hasIssuesEnabled?: boolean | null;
  teamId?: string | null;
  clientMutationId?: string | null;
}
export interface CreateTeamDiscussionCommentInput {
  discussionId: string;
  body: string;
  clientMutationId?: string | null;
}
export interface CreateTeamDiscussionInput {
  teamId: string;
  title: string;
  body: string;
  private?: boolean | null;
  clientMutationId?: string | null;
}
export type Date = string;
export type DateTime = string;
export interface DeclineTopicSuggestionInput {
  repositoryId: string;
  name: string;
  reason: TopicSuggestionDeclineReason;
  clientMutationId?: string | null;
}
export type DefaultRepositoryPermissionField = "NONE" | "READ" | "WRITE" | "ADMIN";
export interface DeleteBranchProtectionRuleInput {
  branchProtectionRuleId: string;
  clientMutationId?: string | null;
}
export interface DeleteDeploymentInput {
  id: string;
  clientMutationId?: string | null;
}
export interface DeleteIpAllowListEntryInput {
  ipAllowListEntryId: string;
  clientMutationId?: string | null;
}
export interface DeleteIssueCommentInput {
  id: string;
  clientMutationId?: string | null;
}
export interface DeleteIssueInput {
  issueId: string;
  clientMutationId?: string | null;
}
export interface DeleteProjectCardInput {
  cardId: string;
  clientMutationId?: string | null;
}
export interface DeleteProjectColumnInput {
  columnId: string;
  clientMutationId?: string | null;
}
export interface DeleteProjectInput {
  projectId: string;
  clientMutationId?: string | null;
}
export interface DeletePullRequestReviewCommentInput {
  id: string;
  clientMutationId?: string | null;
}
export interface DeletePullRequestReviewInput {
  pullRequestReviewId: string;
  clientMutationId?: string | null;
}
export interface DeleteRefInput {
  refId: string;
  clientMutationId?: string | null;
}
export interface DeleteTeamDiscussionCommentInput {
  id: string;
  clientMutationId?: string | null;
}
export interface DeleteTeamDiscussionInput {
  id: string;
  clientMutationId?: string | null;
}
export interface DeleteVerifiableDomainInput {
  id: string;
  clientMutationId?: string | null;
}
export interface DeploymentOrder {
  field: DeploymentOrderField;
  direction: OrderDirection;
}
export type DeploymentOrderField = "CREATED_AT";
export type DeploymentState = "ABANDONED" | "ACTIVE" | "DESTROYED" | "ERROR" | "FAILURE" | "INACTIVE" | "PENDING" | "QUEUED" | "IN_PROGRESS" | "WAITING";
export type DeploymentStatusState = "PENDING" | "SUCCESS" | "FAILURE" | "INACTIVE" | "ERROR" | "QUEUED" | "IN_PROGRESS" | "WAITING";
export type DiffSide = "LEFT" | "RIGHT";
export interface DisablePullRequestAutoMergeInput {
  pullRequestId: string;
  clientMutationId?: string | null;
}
export interface DismissPullRequestReviewInput {
  pullRequestReviewId: string;
  message: string;
  clientMutationId?: string | null;
}
export interface DraftPullRequestReviewComment {
  path: string;
  position: number;
  body: string;
}
export interface DraftPullRequestReviewThread {
  path: string;
  line: number;
  side?: DiffSide | null;
  startLine?: number | null;
  startSide?: DiffSide | null;
  body: string;
}
export interface EnablePullRequestAutoMergeInput {
  pullRequestId: string;
  commitHeadline?: string | null;
  commitBody?: string | null;
  mergeMethod?: PullRequestMergeMethod | null;
  authorEmail?: string | null;
  clientMutationId?: string | null;
}
export interface EnterpriseAdministratorInvitationOrder {
  field: EnterpriseAdministratorInvitationOrderField;
  direction: OrderDirection;
}
export type EnterpriseAdministratorInvitationOrderField = "CREATED_AT";
export type EnterpriseAdministratorRole = "OWNER" | "BILLING_MANAGER";
export type EnterpriseDefaultRepositoryPermissionSettingValue = "NO_POLICY" | "ADMIN" | "WRITE" | "READ" | "NONE";
export type EnterpriseEnabledDisabledSettingValue = "ENABLED" | "DISABLED" | "NO_POLICY";
export type EnterpriseEnabledSettingValue = "ENABLED" | "NO_POLICY";
export interface EnterpriseMemberOrder {
  field: EnterpriseMemberOrderField;
  direction: OrderDirection;
}
export type EnterpriseMemberOrderField = "LOGIN" | "CREATED_AT";
export type EnterpriseMembersCanCreateRepositoriesSettingValue = "NO_POLICY" | "ALL" | "PUBLIC" | "PRIVATE" | "DISABLED";
export type EnterpriseMembersCanMakePurchasesSettingValue = "ENABLED" | "DISABLED";
export interface EnterpriseServerInstallationOrder {
  field: EnterpriseServerInstallationOrderField;
  direction: OrderDirection;
}
export type EnterpriseServerInstallationOrderField = "HOST_NAME" | "CUSTOMER_NAME" | "CREATED_AT";
export interface EnterpriseServerUserAccountEmailOrder {
  field: EnterpriseServerUserAccountEmailOrderField;
  direction: OrderDirection;
}
export type EnterpriseServerUserAccountEmailOrderField = "EMAIL";
export interface EnterpriseServerUserAccountOrder {
  field: EnterpriseServerUserAccountOrderField;
  direction: OrderDirection;
}
export type EnterpriseServerUserAccountOrderField = "LOGIN" | "REMOTE_CREATED_AT";
export interface EnterpriseServerUserAccountsUploadOrder {
  field: EnterpriseServerUserAccountsUploadOrderField;
  direction: OrderDirection;
}
export type EnterpriseServerUserAccountsUploadOrderField = "CREATED_AT";
export type EnterpriseServerUserAccountsUploadSyncState = "PENDING" | "SUCCESS" | "FAILURE";
export type EnterpriseUserAccountMembershipRole = "MEMBER" | "OWNER";
export type EnterpriseUserDeployment = "CLOUD" | "SERVER";
export type FileViewedState = "DISMISSED" | "VIEWED" | "UNVIEWED";
export interface FollowUserInput {
  userId: string;
  clientMutationId?: string | null;
}
export type FundingPlatform = "GITHUB" | "PATREON" | "OPEN_COLLECTIVE" | "KO_FI" | "TIDELIFT" | "COMMUNITY_BRIDGE" | "LIBERAPAY" | "ISSUEHUNT" | "OTECHIE" | "CUSTOM";
export interface GistOrder {
  field: GistOrderField;
  direction: OrderDirection;
}
export type GistOrderField = "CREATED_AT" | "UPDATED_AT" | "PUSHED_AT";
export type GistPrivacy = "PUBLIC" | "SECRET" | "ALL";
export type GitObjectID = string;
export type GitSSHRemote = string;
export type GitSignatureState = "VALID" | "INVALID" | "MALFORMED_SIG" | "UNKNOWN_KEY" | "BAD_EMAIL" | "UNVERIFIED_EMAIL" | "NO_USER" | "UNKNOWN_SIG_TYPE" | "UNSIGNED" | "GPGVERIFY_UNAVAILABLE" | "GPGVERIFY_ERROR" | "NOT_SIGNING_KEY" | "EXPIRED_KEY" | "OCSP_PENDING" | "OCSP_ERROR" | "BAD_CERT" | "OCSP_REVOKED";
export type GitTimestamp = string;
export type HTML = string;
export type IdentityProviderConfigurationState = "ENFORCED" | "CONFIGURED" | "UNCONFIGURED";
export interface InviteEnterpriseAdminInput {
  enterpriseId: string;
  invitee?: string | null;
  email?: string | null;
  role?: EnterpriseAdministratorRole | null;
  clientMutationId?: string | null;
}
export type IpAllowListEnabledSettingValue = "ENABLED" | "DISABLED";
export interface IpAllowListEntryOrder {
  field: IpAllowListEntryOrderField;
  direction: OrderDirection;
}
export type IpAllowListEntryOrderField = "CREATED_AT" | "ALLOW_LIST_VALUE";
export interface IssueCommentOrder {
  field: IssueCommentOrderField;
  direction: OrderDirection;
}
export type IssueCommentOrderField = "UPDATED_AT";
export interface IssueFilters {
  assignee?: string | null;
  createdBy?: string | null;
  labels?: string[] | null;
  mentioned?: string | null;
  milestone?: string | null;
  since?: DateTime | null;
  states?: IssueState[] | null;
  viewerSubscribed?: boolean | null;
}
export interface IssueOrder {
  field: IssueOrderField;
  direction: OrderDirection;
}
export type IssueOrderField = "CREATED_AT" | "UPDATED_AT" | "COMMENTS";
export type IssueState = "OPEN" | "CLOSED";
export type IssueTimelineItemsItemType = "ISSUE_COMMENT" | "CROSS_REFERENCED_EVENT" | "ADDED_TO_PROJECT_EVENT" | "ASSIGNED_EVENT" | "CLOSED_EVENT" | "COMMENT_DELETED_EVENT" | "CONNECTED_EVENT" | "CONVERTED_NOTE_TO_ISSUE_EVENT" | "DEMILESTONED_EVENT" | "DISCONNECTED_EVENT" | "LABELED_EVENT" | "LOCKED_EVENT" | "MARKED_AS_DUPLICATE_EVENT" | "MENTIONED_EVENT" | "MILESTONED_EVENT" | "MOVED_COLUMNS_IN_PROJECT_EVENT" | "PINNED_EVENT" | "REFERENCED_EVENT" | "REMOVED_FROM_PROJECT_EVENT" | "RENAMED_TITLE_EVENT" | "REOPENED_EVENT" | "SUBSCRIBED_EVENT" | "TRANSFERRED_EVENT" | "UNASSIGNED_EVENT" | "UNLABELED_EVENT" | "UNLOCKED_EVENT" | "USER_BLOCKED_EVENT" | "UNMARKED_AS_DUPLICATE_EVENT" | "UNPINNED_EVENT" | "UNSUBSCRIBED_EVENT";
export interface LabelOrder {
  field: LabelOrderField;
  direction: OrderDirection;
}
export type LabelOrderField = "NAME" | "CREATED_AT";
export interface LanguageOrder {
  field: LanguageOrderField;
  direction: OrderDirection;
}
export type LanguageOrderField = "SIZE";
export interface LinkRepositoryToProjectInput {
  projectId: string;
  repositoryId: string;
  clientMutationId?: string | null;
}
export interface LockLockableInput {
  lockableId: string;
  lockReason?: LockReason | null;
  clientMutationId?: string | null;
}
export type LockReason = "OFF_TOPIC" | "TOO_HEATED" | "RESOLVED" | "SPAM";
export interface MarkFileAsViewedInput {
  pullRequestId: string;
  path: string;
  clientMutationId?: string | null;
}
export interface MarkPullRequestReadyForReviewInput {
  pullRequestId: string;
  clientMutationId?: string | null;
}
export interface MergeBranchInput {
  repositoryId: string;
  base: string;
  head: string;
  commitMessage?: string | null;
  authorEmail?: string | null;
  clientMutationId?: string | null;
}
export interface MergePullRequestInput {
  pullRequestId: string;
  commitHeadline?: string | null;
  commitBody?: string | null;
  expectedHeadOid?: GitObjectID | null;
  mergeMethod?: PullRequestMergeMethod | null;
  authorEmail?: string | null;
  clientMutationId?: string | null;
}
export type MergeableState = "MERGEABLE" | "CONFLICTING" | "UNKNOWN";
export interface MilestoneOrder {
  field: MilestoneOrderField;
  direction: OrderDirection;
}
export type MilestoneOrderField = "DUE_DATE" | "CREATED_AT" | "UPDATED_AT" | "NUMBER";
export type MilestoneState = "OPEN" | "CLOSED";
export interface MinimizeCommentInput {
  subjectId: string;
  classifier: ReportedContentClassifiers;
  clientMutationId?: string | null;
}
export interface MoveProjectCardInput {
  cardId: string;
  columnId: string;
  afterCardId?: string | null;
  clientMutationId?: string | null;
}
export interface MoveProjectColumnInput {
  columnId: string;
  afterColumnId?: string | null;
  clientMutationId?: string | null;
}
export type NotificationRestrictionSettingValue = "ENABLED" | "DISABLED";
export type OauthApplicationCreateAuditEntryState = "ACTIVE" | "SUSPENDED" | "PENDING_DELETION";
export type OperationType = "ACCESS" | "AUTHENTICATION" | "CREATE" | "MODIFY" | "REMOVE" | "RESTORE" | "TRANSFER";
export type OrderDirection = "ASC" | "DESC";
export type OrgAddMemberAuditEntryPermission = "READ" | "ADMIN";
export type OrgCreateAuditEntryBillingPlan = "FREE" | "BUSINESS" | "BUSINESS_PLUS" | "UNLIMITED" | "TIERED_PER_SEAT";
export type OrgRemoveBillingManagerAuditEntryReason = "TWO_FACTOR_REQUIREMENT_NON_COMPLIANCE" | "SAML_EXTERNAL_IDENTITY_MISSING" | "SAML_SSO_ENFORCEMENT_REQUIRES_EXTERNAL_IDENTITY";
export type OrgRemoveMemberAuditEntryMembershipType = "DIRECT_MEMBER" | "ADMIN" | "BILLING_MANAGER" | "UNAFFILIATED" | "OUTSIDE_COLLABORATOR";
export type OrgRemoveMemberAuditEntryReason = "TWO_FACTOR_REQUIREMENT_NON_COMPLIANCE" | "SAML_EXTERNAL_IDENTITY_MISSING" | "SAML_SSO_ENFORCEMENT_REQUIRES_EXTERNAL_IDENTITY" | "USER_ACCOUNT_DELETED" | "TWO_FACTOR_ACCOUNT_RECOVERY";
export type OrgRemoveOutsideCollaboratorAuditEntryMembershipType = "OUTSIDE_COLLABORATOR" | "UNAFFILIATED" | "BILLING_MANAGER";
export type OrgRemoveOutsideCollaboratorAuditEntryReason = "TWO_FACTOR_REQUIREMENT_NON_COMPLIANCE" | "SAML_EXTERNAL_IDENTITY_MISSING";
export type OrgUpdateDefaultRepositoryPermissionAuditEntryPermission = "READ" | "WRITE" | "ADMIN" | "NONE";
export type OrgUpdateMemberAuditEntryPermission = "READ" | "ADMIN";
export type OrgUpdateMemberRepositoryCreationPermissionAuditEntryVisibility = "ALL" | "PUBLIC" | "NONE" | "PRIVATE" | "INTERNAL" | "PUBLIC_INTERNAL" | "PRIVATE_INTERNAL" | "PUBLIC_PRIVATE";
export type OrganizationInvitationRole = "DIRECT_MEMBER" | "ADMIN" | "BILLING_MANAGER" | "REINSTATE";
export type OrganizationInvitationType = "USER" | "EMAIL";
export type OrganizationMemberRole = "MEMBER" | "ADMIN";
export type OrganizationMembersCanCreateRepositoriesSettingValue = "ALL" | "PRIVATE" | "DISABLED";
export interface OrganizationOrder {
  field: OrganizationOrderField;
  direction: OrderDirection;
}
export type OrganizationOrderField = "CREATED_AT" | "LOGIN";
export interface PackageFileOrder {
  field?: PackageFileOrderField | null;
  direction?: OrderDirection | null;
}
export type PackageFileOrderField = "CREATED_AT";
export interface PackageOrder {
  field?: PackageOrderField | null;
  direction?: OrderDirection | null;
}
export type PackageOrderField = "CREATED_AT";
export type PackageType = "NPM" | "RUBYGEMS" | "MAVEN" | "DOCKER" | "DEBIAN" | "NUGET" | "PYPI";
export interface PackageVersionOrder {
  field?: PackageVersionOrderField | null;
  direction?: OrderDirection | null;
}
export type PackageVersionOrderField = "CREATED_AT";
export interface PinIssueInput {
  issueId: string;
  clientMutationId?: string | null;
}
export type PinnableItemType = "REPOSITORY" | "GIST" | "ISSUE" | "PROJECT" | "PULL_REQUEST" | "USER" | "ORGANIZATION" | "TEAM";
export type PreciseDateTime = string;
export type ProjectCardArchivedState = "ARCHIVED" | "NOT_ARCHIVED";
export type ProjectCardState = "CONTENT_ONLY" | "NOTE_ONLY" | "REDACTED";
export type ProjectColumnPurpose = "TODO" | "IN_PROGRESS" | "DONE";
export interface ProjectOrder {
  field: ProjectOrderField;
  direction: OrderDirection;
}
export type ProjectOrderField = "CREATED_AT" | "UPDATED_AT" | "NAME";
export type ProjectState = "OPEN" | "CLOSED";
export type ProjectTemplate = "BASIC_KANBAN" | "AUTOMATED_KANBAN_V2" | "AUTOMATED_REVIEWS_KANBAN" | "BUG_TRIAGE";
export type PullRequestMergeMethod = "MERGE" | "SQUASH" | "REBASE";
export interface PullRequestOrder {
  field: PullRequestOrderField;
  direction: OrderDirection;
}
export type PullRequestOrderField = "CREATED_AT" | "UPDATED_AT";
export type PullRequestReviewCommentState = "PENDING" | "SUBMITTED";
export type PullRequestReviewDecision = "CHANGES_REQUESTED" | "APPROVED" | "REVIEW_REQUIRED";
export type PullRequestReviewEvent = "COMMENT" | "APPROVE" | "REQUEST_CHANGES" | "DISMISS";
export type PullRequestReviewState = "PENDING" | "COMMENTED" | "APPROVED" | "CHANGES_REQUESTED" | "DISMISSED";
export type PullRequestState = "OPEN" | "CLOSED" | "MERGED";
export type PullRequestTimelineItemsItemType = "PULL_REQUEST_COMMIT" | "PULL_REQUEST_COMMIT_COMMENT_THREAD" | "PULL_REQUEST_REVIEW" | "PULL_REQUEST_REVIEW_THREAD" | "PULL_REQUEST_REVISION_MARKER" | "AUTOMATIC_BASE_CHANGE_FAILED_EVENT" | "AUTOMATIC_BASE_CHANGE_SUCCEEDED_EVENT" | "AUTO_MERGE_DISABLED_EVENT" | "AUTO_MERGE_ENABLED_EVENT" | "AUTO_REBASE_ENABLED_EVENT" | "AUTO_SQUASH_ENABLED_EVENT" | "BASE_REF_CHANGED_EVENT" | "BASE_REF_FORCE_PUSHED_EVENT" | "BASE_REF_DELETED_EVENT" | "DEPLOYED_EVENT" | "DEPLOYMENT_ENVIRONMENT_CHANGED_EVENT" | "HEAD_REF_DELETED_EVENT" | "HEAD_REF_FORCE_PUSHED_EVENT" | "HEAD_REF_RESTORED_EVENT" | "MERGED_EVENT" | "REVIEW_DISMISSED_EVENT" | "REVIEW_REQUESTED_EVENT" | "REVIEW_REQUEST_REMOVED_EVENT" | "READY_FOR_REVIEW_EVENT" | "CONVERT_TO_DRAFT_EVENT" | "ISSUE_COMMENT" | "CROSS_REFERENCED_EVENT" | "ADDED_TO_PROJECT_EVENT" | "ASSIGNED_EVENT" | "CLOSED_EVENT" | "COMMENT_DELETED_EVENT" | "CONNECTED_EVENT" | "CONVERTED_NOTE_TO_ISSUE_EVENT" | "DEMILESTONED_EVENT" | "DISCONNECTED_EVENT" | "LABELED_EVENT" | "LOCKED_EVENT" | "MARKED_AS_DUPLICATE_EVENT" | "MENTIONED_EVENT" | "MILESTONED_EVENT" | "MOVED_COLUMNS_IN_PROJECT_EVENT" | "PINNED_EVENT" | "REFERENCED_EVENT" | "REMOVED_FROM_PROJECT_EVENT" | "RENAMED_TITLE_EVENT" | "REOPENED_EVENT" | "SUBSCRIBED_EVENT" | "TRANSFERRED_EVENT" | "UNASSIGNED_EVENT" | "UNLABELED_EVENT" | "UNLOCKED_EVENT" | "USER_BLOCKED_EVENT" | "UNMARKED_AS_DUPLICATE_EVENT" | "UNPINNED_EVENT" | "UNSUBSCRIBED_EVENT";
export type PullRequestUpdateState = "OPEN" | "CLOSED";
export type ReactionContent = "THUMBS_UP" | "THUMBS_DOWN" | "LAUGH" | "HOORAY" | "CONFUSED" | "HEART" | "ROCKET" | "EYES";
export interface ReactionOrder {
  field: ReactionOrderField;
  direction: OrderDirection;
}
export type ReactionOrderField = "CREATED_AT";
export interface RefOrder {
  field: RefOrderField;
  direction: OrderDirection;
}
export type RefOrderField = "TAG_COMMIT_DATE" | "ALPHABETICAL";
export interface RegenerateEnterpriseIdentityProviderRecoveryCodesInput {
  enterpriseId: string;
  clientMutationId?: string | null;
}
export interface RegenerateVerifiableDomainTokenInput {
  id: string;
  clientMutationId?: string | null;
}
export interface ReleaseOrder {
  field: ReleaseOrderField;
  direction: OrderDirection;
}
export type ReleaseOrderField = "CREATED_AT" | "NAME";
export interface RemoveAssigneesFromAssignableInput {
  assignableId: string;
  assigneeIds: string[];
  clientMutationId?: string | null;
}
export interface RemoveEnterpriseAdminInput {
  enterpriseId: string;
  login: string;
  clientMutationId?: string | null;
}
export interface RemoveEnterpriseIdentityProviderInput {
  enterpriseId: string;
  clientMutationId?: string | null;
}
export interface RemoveEnterpriseOrganizationInput {
  enterpriseId: string;
  organizationId: string;
  clientMutationId?: string | null;
}
export interface RemoveEnterpriseSupportEntitlementInput {
  enterpriseId: string;
  login: string;
  clientMutationId?: string | null;
}
export interface RemoveLabelsFromLabelableInput {
  labelableId: string;
  labelIds: string[];
  clientMutationId?: string | null;
}
export interface RemoveOutsideCollaboratorInput {
  userId: string;
  organizationId: string;
  clientMutationId?: string | null;
}
export interface RemoveReactionInput {
  subjectId: string;
  content: ReactionContent;
  clientMutationId?: string | null;
}
export interface RemoveStarInput {
  starrableId: string;
  clientMutationId?: string | null;
}
export interface ReopenIssueInput {
  issueId: string;
  clientMutationId?: string | null;
}
export interface ReopenPullRequestInput {
  pullRequestId: string;
  clientMutationId?: string | null;
}
export type RepoAccessAuditEntryVisibility = "INTERNAL" | "PRIVATE" | "PUBLIC";
export type RepoAddMemberAuditEntryVisibility = "INTERNAL" | "PRIVATE" | "PUBLIC";
export type RepoArchivedAuditEntryVisibility = "INTERNAL" | "PRIVATE" | "PUBLIC";
export type RepoChangeMergeSettingAuditEntryMergeType = "MERGE" | "REBASE" | "SQUASH";
export type RepoCreateAuditEntryVisibility = "INTERNAL" | "PRIVATE" | "PUBLIC";
export type RepoDestroyAuditEntryVisibility = "INTERNAL" | "PRIVATE" | "PUBLIC";
export type RepoRemoveMemberAuditEntryVisibility = "INTERNAL" | "PRIVATE" | "PUBLIC";
export type ReportedContentClassifiers = "SPAM" | "ABUSE" | "OFF_TOPIC" | "OUTDATED" | "DUPLICATE" | "RESOLVED";
export type RepositoryAffiliation = "OWNER" | "COLLABORATOR" | "ORGANIZATION_MEMBER";
export type RepositoryContributionType = "COMMIT" | "ISSUE" | "PULL_REQUEST" | "REPOSITORY" | "PULL_REQUEST_REVIEW";
export type RepositoryInteractionLimit = "EXISTING_USERS" | "CONTRIBUTORS_ONLY" | "COLLABORATORS_ONLY" | "NO_LIMIT";
export type RepositoryInteractionLimitExpiry = "ONE_DAY" | "THREE_DAYS" | "ONE_WEEK" | "ONE_MONTH" | "SIX_MONTHS";
export type RepositoryInteractionLimitOrigin = "REPOSITORY" | "ORGANIZATION" | "USER";
export interface RepositoryInvitationOrder {
  field: RepositoryInvitationOrderField;
  direction: OrderDirection;
}
export type RepositoryInvitationOrderField = "CREATED_AT" | "INVITEE_LOGIN";
export type RepositoryLockReason = "MOVING" | "BILLING" | "RENAME" | "MIGRATING";
export interface RepositoryOrder {
  field: RepositoryOrderField;
  direction: OrderDirection;
}
export type RepositoryOrderField = "CREATED_AT" | "UPDATED_AT" | "PUSHED_AT" | "NAME" | "STARGAZERS";
export type RepositoryPermission = "ADMIN" | "MAINTAIN" | "WRITE" | "TRIAGE" | "READ";
export type RepositoryPrivacy = "PUBLIC" | "PRIVATE";
export type RepositoryVisibility = "PRIVATE" | "PUBLIC" | "INTERNAL";
export interface RequestReviewsInput {
  pullRequestId: string;
  userIds?: string[] | null;
  teamIds?: string[] | null;
  union?: boolean | null;
  clientMutationId?: string | null;
}
export type RequestableCheckStatusState = "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "WAITING";
export interface RerequestCheckSuiteInput {
  repositoryId: string;
  checkSuiteId: string;
  clientMutationId?: string | null;
}
export interface ResolveReviewThreadInput {
  threadId: string;
  clientMutationId?: string | null;
}
export type SamlDigestAlgorithm = "SHA1" | "SHA256" | "SHA384" | "SHA512";
export type SamlSignatureAlgorithm = "RSA_SHA1" | "RSA_SHA256" | "RSA_SHA384" | "RSA_SHA512";
export interface SavedReplyOrder {
  field: SavedReplyOrderField;
  direction: OrderDirection;
}
export type SavedReplyOrderField = "UPDATED_AT";
export type SearchType = "ISSUE" | "REPOSITORY" | "USER";
export type SecurityAdvisoryEcosystem = "RUBYGEMS" | "NPM" | "PIP" | "MAVEN" | "NUGET" | "COMPOSER";
export interface SecurityAdvisoryIdentifierFilter {
  type: SecurityAdvisoryIdentifierType;
  value: string;
}
export type SecurityAdvisoryIdentifierType = "CVE" | "GHSA";
export interface SecurityAdvisoryOrder {
  field: SecurityAdvisoryOrderField;
  direction: OrderDirection;
}
export type SecurityAdvisoryOrderField = "PUBLISHED_AT" | "UPDATED_AT";
export type SecurityAdvisorySeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export interface SecurityVulnerabilityOrder {
  field: SecurityVulnerabilityOrderField;
  direction: OrderDirection;
}
export type SecurityVulnerabilityOrderField = "UPDATED_AT";
export interface SetEnterpriseIdentityProviderInput {
  enterpriseId: string;
  ssoUrl: URI;
  issuer?: string | null;
  idpCertificate: string;
  signatureMethod: SamlSignatureAlgorithm;
  digestMethod: SamlDigestAlgorithm;
  clientMutationId?: string | null;
}
export interface SetOrganizationInteractionLimitInput {
  organizationId: string;
  limit: RepositoryInteractionLimit;
  expiry?: RepositoryInteractionLimitExpiry | null;
  clientMutationId?: string | null;
}
export interface SetRepositoryInteractionLimitInput {
  repositoryId: string;
  limit: RepositoryInteractionLimit;
  expiry?: RepositoryInteractionLimitExpiry | null;
  clientMutationId?: string | null;
}
export interface SetUserInteractionLimitInput {
  userId: string;
  limit: RepositoryInteractionLimit;
  expiry?: RepositoryInteractionLimitExpiry | null;
  clientMutationId?: string | null;
}
export interface SponsorableOrder {
  field: SponsorableOrderField;
  direction: OrderDirection;
}
export type SponsorableOrderField = "LOGIN";
export type SponsorsGoalKind = "TOTAL_SPONSORS_COUNT" | "MONTHLY_SPONSORSHIP_AMOUNT";
export interface SponsorsTierOrder {
  field: SponsorsTierOrderField;
  direction: OrderDirection;
}
export type SponsorsTierOrderField = "CREATED_AT" | "MONTHLY_PRICE_IN_CENTS";
export interface SponsorshipOrder {
  field: SponsorshipOrderField;
  direction: OrderDirection;
}
export type SponsorshipOrderField = "CREATED_AT";
export type SponsorshipPrivacy = "PUBLIC" | "PRIVATE";
export interface StarOrder {
  field: StarOrderField;
  direction: OrderDirection;
}
export type StarOrderField = "STARRED_AT";
export type StatusState = "EXPECTED" | "ERROR" | "FAILURE" | "PENDING" | "SUCCESS";
export interface SubmitPullRequestReviewInput {
  pullRequestId?: string | null;
  pullRequestReviewId?: string | null;
  event: PullRequestReviewEvent;
  body?: string | null;
  clientMutationId?: string | null;
}
export type SubscriptionState = "UNSUBSCRIBED" | "SUBSCRIBED" | "IGNORED";
export interface TeamDiscussionCommentOrder {
  field: TeamDiscussionCommentOrderField;
  direction: OrderDirection;
}
export type TeamDiscussionCommentOrderField = "NUMBER";
export interface TeamDiscussionOrder {
  field: TeamDiscussionOrderField;
  direction: OrderDirection;
}
export type TeamDiscussionOrderField = "CREATED_AT";
export interface TeamMemberOrder {
  field: TeamMemberOrderField;
  direction: OrderDirection;
}
export type TeamMemberOrderField = "LOGIN" | "CREATED_AT";
export type TeamMemberRole = "MAINTAINER" | "MEMBER";
export type TeamMembershipType = "IMMEDIATE" | "CHILD_TEAM" | "ALL";
export interface TeamOrder {
  field: TeamOrderField;
  direction: OrderDirection;
}
export type TeamOrderField = "NAME";
export type TeamPrivacy = "SECRET" | "VISIBLE";
export interface TeamRepositoryOrder {
  field: TeamRepositoryOrderField;
  direction: OrderDirection;
}
export type TeamRepositoryOrderField = "CREATED_AT" | "UPDATED_AT" | "PUSHED_AT" | "NAME" | "PERMISSION" | "STARGAZERS";
export type TeamRole = "ADMIN" | "MEMBER";
export type TopicSuggestionDeclineReason = "NOT_RELEVANT" | "TOO_SPECIFIC" | "PERSONAL_PREFERENCE" | "TOO_GENERAL";
export interface TransferIssueInput {
  issueId: string;
  repositoryId: string;
  clientMutationId?: string | null;
}
export type URI = string;
export interface UnarchiveRepositoryInput {
  repositoryId: string;
  clientMutationId?: string | null;
}
export interface UnfollowUserInput {
  userId: string;
  clientMutationId?: string | null;
}
export interface UnlinkRepositoryFromProjectInput {
  projectId: string;
  repositoryId: string;
  clientMutationId?: string | null;
}
export interface UnlockLockableInput {
  lockableId: string;
  clientMutationId?: string | null;
}
export interface UnmarkFileAsViewedInput {
  pullRequestId: string;
  path: string;
  clientMutationId?: string | null;
}
export interface UnmarkIssueAsDuplicateInput {
  duplicateId: string;
  canonicalId: string;
  clientMutationId?: string | null;
}
export interface UnminimizeCommentInput {
  subjectId: string;
  clientMutationId?: string | null;
}
export interface UnpinIssueInput {
  issueId: string;
  clientMutationId?: string | null;
}
export interface UnresolveReviewThreadInput {
  threadId: string;
  clientMutationId?: string | null;
}
export interface UpdateBranchProtectionRuleInput {
  branchProtectionRuleId: string;
  pattern?: string | null;
  requiresApprovingReviews?: boolean | null;
  requiredApprovingReviewCount?: number | null;
  requiresCommitSignatures?: boolean | null;
  requiresLinearHistory?: boolean | null;
  allowsForcePushes?: boolean | null;
  allowsDeletions?: boolean | null;
  isAdminEnforced?: boolean | null;
  requiresStatusChecks?: boolean | null;
  requiresStrictStatusChecks?: boolean | null;
  requiresCodeOwnerReviews?: boolean | null;
  dismissesStaleReviews?: boolean | null;
  restrictsReviewDismissals?: boolean | null;
  reviewDismissalActorIds?: string[] | null;
  restrictsPushes?: boolean | null;
  pushActorIds?: string[] | null;
  requiredStatusCheckContexts?: string[] | null;
  clientMutationId?: string | null;
}
export interface UpdateCheckRunInput {
  repositoryId: string;
  checkRunId: string;
  name?: string | null;
  detailsUrl?: URI | null;
  externalId?: string | null;
  status?: RequestableCheckStatusState | null;
  startedAt?: DateTime | null;
  conclusion?: CheckConclusionState | null;
  completedAt?: DateTime | null;
  output?: CheckRunOutput | null;
  actions?: CheckRunAction[] | null;
  clientMutationId?: string | null;
}
export interface UpdateCheckSuitePreferencesInput {
  repositoryId: string;
  autoTriggerPreferences: CheckSuiteAutoTriggerPreference[];
  clientMutationId?: string | null;
}
export interface UpdateEnterpriseAdministratorRoleInput {
  enterpriseId: string;
  login: string;
  role: EnterpriseAdministratorRole;
  clientMutationId?: string | null;
}
export interface UpdateEnterpriseAllowPrivateRepositoryForkingSettingInput {
  enterpriseId: string;
  settingValue: EnterpriseEnabledDisabledSettingValue;
  clientMutationId?: string | null;
}
export interface UpdateEnterpriseDefaultRepositoryPermissionSettingInput {
  enterpriseId: string;
  settingValue: EnterpriseDefaultRepositoryPermissionSettingValue;
  clientMutationId?: string | null;
}
export interface UpdateEnterpriseMembersCanChangeRepositoryVisibilitySettingInput {
  enterpriseId: string;
  settingValue: EnterpriseEnabledDisabledSettingValue;
  clientMutationId?: string | null;
}
export interface UpdateEnterpriseMembersCanCreateRepositoriesSettingInput {
  enterpriseId: string;
  settingValue?: EnterpriseMembersCanCreateRepositoriesSettingValue | null;
  membersCanCreateRepositoriesPolicyEnabled?: boolean | null;
  membersCanCreatePublicRepositories?: boolean | null;
  membersCanCreatePrivateRepositories?: boolean | null;
  membersCanCreateInternalRepositories?: boolean | null;
  clientMutationId?: string | null;
}
export interface UpdateEnterpriseMembersCanDeleteIssuesSettingInput {
  enterpriseId: string;
  settingValue: EnterpriseEnabledDisabledSettingValue;
  clientMutationId?: string | null;
}
export interface UpdateEnterpriseMembersCanDeleteRepositoriesSettingInput {
  enterpriseId: string;
  settingValue: EnterpriseEnabledDisabledSettingValue;
  clientMutationId?: string | null;
}
export interface UpdateEnterpriseMembersCanInviteCollaboratorsSettingInput {
  enterpriseId: string;
  settingValue: EnterpriseEnabledDisabledSettingValue;
  clientMutationId?: string | null;
}
export interface UpdateEnterpriseMembersCanMakePurchasesSettingInput {
  enterpriseId: string;
  settingValue: EnterpriseMembersCanMakePurchasesSettingValue;
  clientMutationId?: string | null;
}
export interface UpdateEnterpriseMembersCanUpdateProtectedBranchesSettingInput {
  enterpriseId: string;
  settingValue: EnterpriseEnabledDisabledSettingValue;
  clientMutationId?: string | null;
}
export interface UpdateEnterpriseMembersCanViewDependencyInsightsSettingInput {
  enterpriseId: string;
  settingValue: EnterpriseEnabledDisabledSettingValue;
  clientMutationId?: string | null;
}
export interface UpdateEnterpriseOrganizationProjectsSettingInput {
  enterpriseId: string;
  settingValue: EnterpriseEnabledDisabledSettingValue;
  clientMutationId?: string | null;
}
export interface UpdateEnterpriseProfileInput {
  enterpriseId: string;
  name?: string | null;
  description?: string | null;
  websiteUrl?: string | null;
  location?: string | null;
  clientMutationId?: string | null;
}
export interface UpdateEnterpriseRepositoryProjectsSettingInput {
  enterpriseId: string;
  settingValue: EnterpriseEnabledDisabledSettingValue;
  clientMutationId?: string | null;
}
export interface UpdateEnterpriseTeamDiscussionsSettingInput {
  enterpriseId: string;
  settingValue: EnterpriseEnabledDisabledSettingValue;
  clientMutationId?: string | null;
}
export interface UpdateEnterpriseTwoFactorAuthenticationRequiredSettingInput {
  enterpriseId: string;
  settingValue: EnterpriseEnabledSettingValue;
  clientMutationId?: string | null;
}
export interface UpdateIpAllowListEnabledSettingInput {
  ownerId: string;
  settingValue: IpAllowListEnabledSettingValue;
  clientMutationId?: string | null;
}
export interface UpdateIpAllowListEntryInput {
  ipAllowListEntryId: string;
  allowListValue: string;
  name?: string | null;
  isActive: boolean;
  clientMutationId?: string | null;
}
export interface UpdateIssueCommentInput {
  id: string;
  body: string;
  clientMutationId?: string | null;
}
export interface UpdateIssueInput {
  id: string;
  title?: string | null;
  body?: string | null;
  assigneeIds?: string[] | null;
  milestoneId?: string | null;
  labelIds?: string[] | null;
  state?: IssueState | null;
  projectIds?: string[] | null;
  clientMutationId?: string | null;
}
export interface UpdateNotificationRestrictionSettingInput {
  ownerId: string;
  settingValue: NotificationRestrictionSettingValue;
  clientMutationId?: string | null;
}
export interface UpdateProjectCardInput {
  projectCardId: string;
  isArchived?: boolean | null;
  note?: string | null;
  clientMutationId?: string | null;
}
export interface UpdateProjectColumnInput {
  projectColumnId: string;
  name: string;
  clientMutationId?: string | null;
}
export interface UpdateProjectInput {
  projectId: string;
  name?: string | null;
  body?: string | null;
  state?: ProjectState | null;
  public?: boolean | null;
  clientMutationId?: string | null;
}
export interface UpdatePullRequestInput {
  pullRequestId: string;
  baseRefName?: string | null;
  title?: string | null;
  body?: string | null;
  state?: PullRequestUpdateState | null;
  maintainerCanModify?: boolean | null;
  assigneeIds?: string[] | null;
  milestoneId?: string | null;
  labelIds?: string[] | null;
  projectIds?: string[] | null;
  clientMutationId?: string | null;
}
export interface UpdatePullRequestReviewCommentInput {
  pullRequestReviewCommentId: string;
  body: string;
  clientMutationId?: string | null;
}
export interface UpdatePullRequestReviewInput {
  pullRequestReviewId: string;
  body: string;
  clientMutationId?: string | null;
}
export interface UpdateRefInput {
  refId: string;
  oid: GitObjectID;
  force?: boolean | null;
  clientMutationId?: string | null;
}
export interface UpdateRepositoryInput {
  repositoryId: string;
  name?: string | null;
  description?: string | null;
  template?: boolean | null;
  homepageUrl?: URI | null;
  hasWikiEnabled?: boolean | null;
  hasIssuesEnabled?: boolean | null;
  hasProjectsEnabled?: boolean | null;
  clientMutationId?: string | null;
}
export interface UpdateSubscriptionInput {
  subscribableId: string;
  state: SubscriptionState;
  clientMutationId?: string | null;
}
export interface UpdateTeamDiscussionCommentInput {
  id: string;
  body: string;
  bodyVersion?: string | null;
  clientMutationId?: string | null;
}
export interface UpdateTeamDiscussionInput {
  id: string;
  title?: string | null;
  body?: string | null;
  bodyVersion?: string | null;
  pinned?: boolean | null;
  clientMutationId?: string | null;
}
export interface UpdateTopicsInput {
  repositoryId: string;
  topicNames: string[];
  clientMutationId?: string | null;
}
export type UserBlockDuration = "ONE_DAY" | "THREE_DAYS" | "ONE_WEEK" | "ONE_MONTH" | "PERMANENT";
export interface UserStatusOrder {
  field: UserStatusOrderField;
  direction: OrderDirection;
}
export type UserStatusOrderField = "UPDATED_AT";
export interface VerifiableDomainOrder {
  field: VerifiableDomainOrderField;
  direction: OrderDirection;
}
export type VerifiableDomainOrderField = "DOMAIN" | "CREATED_AT";
export interface VerifyVerifiableDomainInput {
  id: string;
  clientMutationId?: string | null;
}
export type X509Certificate = string;