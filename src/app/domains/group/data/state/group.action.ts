import { GroupDto } from '../dto/group.dto'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
import { GroupModel } from '../../../../shared/util-model/model/group.model'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'

export enum GroupActionEnum {
    START_GROUPS_PAGE_LOADER = '[Local] Starting Group\'s page loader',
    STOP_GROUPS_PAGE_LOADER = '[Local] Stopping Group\'s page loader',

    START_GROUP_MEMBERS_PAGE_LOADER = '[Local] Starting participants of group page loader',
    STOP_GROUPS_MEMBERS_PAGE_LOADER = '[Local] Stopping participants of group page loader',

    START_GROUP_LOADER = '[Local] Starting Group\'s loader',
    STOP_GROUP_LOADER = '[Local] Stopping Group\'s loader',

    FETCH_GROUP_PAGE = '[Backend] Fetching Group\'s page',
    INPUT_GROUP_PAGE_SEARCH = '[Local] Inputting Group\'s page search',
    INPUT_GROUP_PAGE_DATE_RANGE = '[Local] Inputting Group\'s page date range',
    SELECT_GROUP_PAGE_VISIBILITY = '[Local] Selecting Group\'s page visibility',
    SELECT_GROUP_PAGE_ORDER = '[Local] Selecting Group\'s page order',

    FETCH_GROUP_MEMBER_PAGE = '[Backend] Fetching participants of group page',
    INPUT_GROUP_MEMBER_PAGE_SEARCH = '[Local] Inputting participants of group page search',
    INPUT_GROUP_MEMBER_PAGE_DATE_RANGE = '[Local] Inputting participants of group page date range',
    SELECT_GROUP_MEMBER_PAGE_VISIBILITY = '[Local] Selecting participants of group page visibility',
    SELECT_GROUP_MEMBER_PAGE_ORDER = '[Local] Selecting participants of group page order',

    FETCH_GROUP = '[Backend] Fetching Group',
    SEARCH_PARTICIPANTS = '[Backend] Searching participants to add in a group',
    CREATE_GROUP = '[Backend] Creating Group',
    UPDATE_GROUP = '[Backend] Updating Group',
    ADD_MEMBERS_TO_GROUP = '[Backend] Adding members to group',
    REMOVE_MEMBER_FROM_GROUP = '[Backend] Removing member from group',
    DISABLE_GROUP = '[Backend] Disabling Group',
    ENABLE_GROUP = '[Backend] Enabling Group',
    DELETE_GROUP = '[Backend] Deleting Group',

    RESET_GROUP = '[Local] Resetting Group',
}

export class StartGroupsPageLoader {
    public static readonly type: GroupActionEnum = GroupActionEnum.START_GROUPS_PAGE_LOADER
}

export class StopGroupsPageLoader {
    public static readonly type: GroupActionEnum = GroupActionEnum.STOP_GROUPS_PAGE_LOADER
}

export class StartGroupMembersPageLoader {
    public static readonly type: GroupActionEnum = GroupActionEnum.START_GROUP_MEMBERS_PAGE_LOADER
}

export class StopGroupMembersPageLoader {
    public static readonly type: GroupActionEnum = GroupActionEnum.STOP_GROUPS_MEMBERS_PAGE_LOADER
}

export class StartGroupLoader {
    public static readonly type: GroupActionEnum = GroupActionEnum.START_GROUP_LOADER
}

export class StopGroupLoader {
    public static readonly type: GroupActionEnum = GroupActionEnum.STOP_GROUP_LOADER
}

export class FetchGroupPage {
    public static readonly type: GroupActionEnum = GroupActionEnum.FETCH_GROUP_PAGE

    public constructor (
        public readonly eventId: string | undefined,
        public readonly offset: number | undefined,
        public readonly limit: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class InputGroupPageSearch {
    public static readonly type: GroupActionEnum = GroupActionEnum.INPUT_GROUP_PAGE_SEARCH

    public constructor (public readonly searched: string | undefined) {}
}

export class InputGroupPageDateRange {
    public static readonly type: GroupActionEnum = GroupActionEnum.INPUT_GROUP_PAGE_DATE_RANGE

    public constructor (
        public readonly start: Date | undefined,
        public readonly end: Date | undefined,
    ) {}
}

export class SelectGroupPageVisibility {
    public static readonly type: GroupActionEnum = GroupActionEnum.SELECT_GROUP_PAGE_VISIBILITY

    public constructor (public readonly onlyVisible: boolean) {}
}

export class SelectGroupPageOrder {
    public static readonly type: GroupActionEnum = GroupActionEnum.SELECT_GROUP_PAGE_ORDER

    public constructor (public readonly order: OrderEnum) {}
}

export class FetchGroupMembersPage {
    public static readonly type: GroupActionEnum = GroupActionEnum.FETCH_GROUP_MEMBER_PAGE

    public constructor (
        public readonly eventId: string | undefined,
        public readonly id: string | undefined,
        public readonly offset: number | undefined,
        public readonly limit: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class InputGroupMemberPageSearch {
    public static readonly type: GroupActionEnum = GroupActionEnum.INPUT_GROUP_MEMBER_PAGE_SEARCH

    public constructor (public readonly searched: string | undefined) {}
}

export class InputGroupMemberPageDateRange {
    public static readonly type: GroupActionEnum = GroupActionEnum.INPUT_GROUP_MEMBER_PAGE_DATE_RANGE

    public constructor (
        public readonly start: Date | undefined,
        public readonly end: Date | undefined,
    ) {}
}

export class SelectGroupMemberPageVisibility {
    public static readonly type: GroupActionEnum = GroupActionEnum.SELECT_GROUP_MEMBER_PAGE_VISIBILITY

    public constructor (public readonly onlyVisible: boolean) {}
}

export class SelectGroupMemberPageOrder {
    public static readonly type: GroupActionEnum = GroupActionEnum.SELECT_GROUP_MEMBER_PAGE_ORDER

    public constructor (public readonly order: OrderEnum) {}
}

export class FetchGroup {
    public static readonly type: GroupActionEnum = GroupActionEnum.FETCH_GROUP

    public constructor (public readonly eventId: string | undefined, public readonly id: string) {}
}

export class SearchParticipants {
    public static readonly type: GroupActionEnum = GroupActionEnum.SEARCH_PARTICIPANTS

    public constructor (
        public readonly eventId: string | undefined,
        public readonly searched: string | undefined,
    ) {}
}

export class ResetGroup {
    public static readonly type: GroupActionEnum = GroupActionEnum.RESET_GROUP
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
