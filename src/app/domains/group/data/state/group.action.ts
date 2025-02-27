import { GroupDto } from '../dto/group.dto'
import { GroupModel } from '../../../../shared/util-model/model/group.model'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'

export enum GroupActionEnum {
    START_GROUPS_PAGE_LOADER = '[Local] Starting groups\' page loader',
    STOP_GROUPS_PAGE_LOADER = '[Local] Stopping groups\' page loader',

    FETCH_GROUPS_PAGE = '[Backend] Fetching groups\' page',
    FETCH_GROUPS_MEMBERS = '[Backend] Fetching groups\' members',
    INPUT_GROUPS_PAGE_TEXT_SEARCH = '[Local] Inputting groups\' page text search',
    INPUT_GROUPS_PAGE_DATE_TIME_SEARCH = '[Local] Inputting groups\' page date time search',
    SELECT_GROUPS_PAGE_PRESENCE_SEARCH = '[Local] Selecting groups\' page presence search',
    SELECT_GROUPS_PAGE_VISIBILITY_SEARCH = '[Local] Selecting groups\' page visibility search',

    START_GROUP_MEMBERS_PAGE_LOADER = '[Local] Starting group members\' page loader',
    STOP_GROUP_MEMBERS_PAGE_LOADER = '[Local] Stopping group members\' page loader',

    FETCH_GROUP_MEMBERS_PAGE = '[Backend] Fetching group members\' page',
    INPUT_GROUP_MEMBERS_PAGE_TEXT_SEARCH = '[Local] Inputting group members\' page text search',
    SELECT_GROUP_MEMBERS_PAGE_STATUS_SEARCH = '[Local] Selecting group members\' page status search',
    SELECT_GROUP_MEMBERS_PAGE_VISIBILITY_SEARCH = '[Local] Selecting group members\' page visibility search',

    START_GROUP_LOADER = '[Local] Starting group loader',
    STOP_GROUP_LOADER = '[Local] Stopping group loader',

    FETCH_GROUP = '[Backend] Fetching Group',
    RESET_GROUP = '[Local] Resetting Group',
    SEARCH_PARTICIPANTS = '[Backend] Searching participants to add in a group',
    CREATE_GROUP = '[Backend] Creating Group',
    UPDATE_GROUP = '[Backend] Updating Group',
    ADD_MEMBERS_TO_GROUP = '[Backend] Adding members to group',
    REMOVE_MEMBER_FROM_GROUP = '[Backend] Removing member from group',
    DISABLE_GROUP = '[Backend] Disabling Group',
    ENABLE_GROUP = '[Backend] Enabling Group',
    DELETE_GROUP = '[Backend] Deleting Group',
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
        public readonly eventId: string | undefined,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class FetchGroupsMembers {
    public static readonly type: GroupActionEnum = GroupActionEnum.FETCH_GROUPS_MEMBERS

    public constructor (
        public readonly eventId: string | undefined,
        public readonly groupIds: string[],
    ) {}
}

export class InputGroupsPageTextSearched {
    public static readonly type: GroupActionEnum = GroupActionEnum.INPUT_GROUPS_PAGE_TEXT_SEARCH

    public constructor (public readonly searched: string | undefined) {}
}

export class InputGroupsPageDateTimeSearched {
    public static readonly type: GroupActionEnum = GroupActionEnum.INPUT_GROUPS_PAGE_DATE_TIME_SEARCH

    public constructor (public readonly dateTimeSearched: Date | undefined) {}
}

export class SelectGroupsPagePresenceSearched {
    public static readonly type: GroupActionEnum = GroupActionEnum.SELECT_GROUPS_PAGE_PRESENCE_SEARCH

    public constructor (public readonly presenceSearched: boolean | undefined) {}
}

export class SelectGroupsPageVisibilitySearched {
    public static readonly type: GroupActionEnum = GroupActionEnum.SELECT_GROUPS_PAGE_VISIBILITY_SEARCH

    public constructor (public readonly visibilitySearched: boolean | undefined) {}
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
        public readonly eventId: string | undefined,
        public readonly id: string | undefined,
        public readonly pageNumber: number | undefined,
        public readonly pageSize: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class InputGroupMembersPageTextSearched {
    public static readonly type: GroupActionEnum = GroupActionEnum.INPUT_GROUP_MEMBERS_PAGE_TEXT_SEARCH

    public constructor (public readonly textSearched: string | undefined) {}
}

export class SelectGroupMembersPageStatusSearched {
    public static readonly type: GroupActionEnum = GroupActionEnum.SELECT_GROUP_MEMBERS_PAGE_STATUS_SEARCH

    public constructor (public readonly statusSearched: string | undefined) {}
}

export class SelectGroupMembersPageVisibilitySearched {
    public static readonly type: GroupActionEnum = GroupActionEnum.SELECT_GROUP_MEMBERS_PAGE_VISIBILITY_SEARCH

    public constructor (public readonly visibilitySearched: boolean | undefined) {}
}

export class StartGroupLoader {
    public static readonly type: GroupActionEnum = GroupActionEnum.START_GROUP_LOADER
}

export class StopGroupLoader {
    public static readonly type: GroupActionEnum = GroupActionEnum.STOP_GROUP_LOADER
}

export class FetchGroup {
    public static readonly type: GroupActionEnum = GroupActionEnum.FETCH_GROUP

    public constructor (public readonly eventId: string | undefined, public readonly id: string) {}
}

export class ResetGroup {
    public static readonly type: GroupActionEnum = GroupActionEnum.RESET_GROUP
}

export class SearchParticipants {
    public static readonly type: GroupActionEnum = GroupActionEnum.SEARCH_PARTICIPANTS

    public constructor (
        public readonly eventId: string | undefined,
        public readonly textSearched: string | undefined,
    ) {}
}

export class CreateGroup {
    public static readonly type: GroupActionEnum = GroupActionEnum.CREATE_GROUP

    public constructor (public readonly eventId: string | undefined, public readonly group: GroupDto) {}
}

export class UpdateGroup {
    public static readonly type: GroupActionEnum = GroupActionEnum.UPDATE_GROUP

    public constructor (
        public readonly eventId: string | undefined,
        public readonly id: string,
        public readonly group: GroupDto,
    ) {}
}

export class AddMembersToGroup {
    public static readonly type: GroupActionEnum = GroupActionEnum.ADD_MEMBERS_TO_GROUP

    public constructor (
        public readonly eventId: string | undefined,
        public readonly id: string,
        public readonly memberIds: string[],
    ) {}
}

export class RemoveMemberFromGroup {
    public static readonly type: GroupActionEnum = GroupActionEnum.REMOVE_MEMBER_FROM_GROUP

    public constructor (
        public readonly eventId: string | undefined,
        public readonly id: string,
        public readonly participant: ParticipantModel,
    ) {}
}

export class DisableGroup {
    public static readonly type: GroupActionEnum = GroupActionEnum.DISABLE_GROUP

    public constructor (public readonly eventId: string | undefined, public readonly id: string) {}
}

export class EnableGroup {
    public static readonly type: GroupActionEnum = GroupActionEnum.ENABLE_GROUP

    public constructor (public readonly eventId: string | undefined, public readonly id: string) {}
}

export class DeleteGroup {
    public static readonly type: GroupActionEnum = GroupActionEnum.DELETE_GROUP

    public constructor (public readonly eventId: string | undefined, public readonly group: GroupModel) {}
}
