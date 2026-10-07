import { ParticipantPageParamsModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model'
import { GroupPageParamsModel } from '@pages/projects/[projectId]/configuration/groups/data/model/group-page-params.model'

enum GroupActionEnum {
    RESET_GROUP_STATE = '[Local] Resetting group state',

    START_GROUPS_PAGE_LOADER = '[Local] Starting groups\' page loader',
    STOP_GROUPS_PAGE_LOADER = '[Local] Stopping groups\' page loader',

    FETCH_GROUPS_PAGE = '[Backend] Fetching groups\' page',
    UPDATE_GROUPS_PAGE_SEARCH_PARAMS = '[Local] Updating groups\' page search params',

    START_GROUP_MEMBERS_PAGE_LOADER = '[Local] Starting group members\' page loader',
    STOP_GROUP_MEMBERS_PAGE_LOADER = '[Local] Stopping group members\' page loader',

    FETCH_GROUP_MEMBERS_PAGE = '[Backend] Fetching group members\' page',
    UPDATE_GROUP_MEMBERS_PAGE_SEARCH_PARAMS = '[Local] Updating group members\' page search params',


    SEARCH_PARTICIPANTS = '[Backend] Searching participants to add in a group',
}

export class ResetGroupState {
    public static readonly type: GroupActionEnum = GroupActionEnum.RESET_GROUP_STATE
}

export class StartGroupsPageLoader {
    public static readonly type: GroupActionEnum = GroupActionEnum.START_GROUPS_PAGE_LOADER
}

export class StopGroupsPageLoader {
    public static readonly type: GroupActionEnum = GroupActionEnum.STOP_GROUPS_PAGE_LOADER
}

export class FetchGroupsPage {
    public static readonly type: GroupActionEnum = GroupActionEnum.FETCH_GROUPS_PAGE

    public constructor (
        public readonly projectId: string | undefined,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class UpdateGroupsPageSearchParams {
    public static readonly type: GroupActionEnum = GroupActionEnum.UPDATE_GROUPS_PAGE_SEARCH_PARAMS

    public constructor (public readonly params: GroupPageParamsModel) {}
}

export class StartGroupMembersPageLoader {
    public static readonly type: GroupActionEnum = GroupActionEnum.START_GROUP_MEMBERS_PAGE_LOADER
}

export class StopGroupMembersPageLoader {
    public static readonly type: GroupActionEnum = GroupActionEnum.STOP_GROUP_MEMBERS_PAGE_LOADER
}

export class FetchGroupMembersPage {
    public static readonly type: GroupActionEnum = GroupActionEnum.FETCH_GROUP_MEMBERS_PAGE

    public constructor (
        public readonly projectId: string | undefined,
        public readonly id: string | undefined,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class UpdateGroupMembersPageSearchParams {
    public static readonly type: GroupActionEnum = GroupActionEnum.UPDATE_GROUP_MEMBERS_PAGE_SEARCH_PARAMS

    public constructor (public readonly params: ParticipantPageParamsModel) {}
}

export class SearchParticipants {
    public static readonly type: GroupActionEnum = GroupActionEnum.SEARCH_PARTICIPANTS

    public constructor (
        public readonly projectId: string | undefined,
        public readonly textSearched: string | undefined,
    ) {}
}
