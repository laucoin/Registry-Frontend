import { UserModel } from '../../../../shared/util-model/model/user.model'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'

export enum UserActionEnum {
    START_USERS_PAGE_LOADER = '[Local] Starting users\' page loader',
    STOP_USERS_PAGE_LOADER = '[Local] Stopping users\' page loader',

    FETCH_USERS_PAGE = '[Backend] Fetching users\' page',
    INPUT_USERS_PAGE_SEARCH = '[Local] Inputting users\' page search',
    SELECT_USERS_PAGE_VISIBILITY = '[Local] Selecting users\' page visibility',
    SELECT_USERS_PAGE_ORDER = '[Local] Selecting users\' page order',

    START_USER_LOADER = '[Local] Starting user loader',
    STOP_USER_LOADER = '[Local] Stopping user loader',

    FETCH_USER = '[Backend] Fetching user',
    RESET_USER = '[Local] Resetting user',
    FETCH_ASSIGNABLE_USER_ROLES = '[Backend] Fetching assignable user roles',
    UPDATE_USER_ROLE = '[Backend] Updating user role',
    BLOCK_USER = '[Backend] Blocking user',
    UNBLOCK_USER = '[Backend] Unblocking user',
    IMPERSONATE_USER = '[Backend] Impersonating user',
    DELETE_USER = '[Backend] Deleting user',
}

export class StartUsersPageLoader {
    public static readonly type: UserActionEnum = UserActionEnum.START_USERS_PAGE_LOADER
}

export class StopUsersPageLoader {
    public static readonly type: UserActionEnum = UserActionEnum.STOP_USERS_PAGE_LOADER
}

export class FetchUsersPage {
    public static readonly type: UserActionEnum = UserActionEnum.FETCH_USERS_PAGE

    public constructor (
        public readonly offset: number | undefined,
        public readonly limit: number | undefined,
        public readonly force: boolean = false,
    ) {}
}

export class InputUsersPageSearch {
    public static readonly type: UserActionEnum = UserActionEnum.INPUT_USERS_PAGE_SEARCH

    public constructor (public readonly searched: string | undefined) {}
}

export class SelectUsersPageVisibility {
    public static readonly type: UserActionEnum = UserActionEnum.SELECT_USERS_PAGE_VISIBILITY

    public constructor (public readonly onlyVisible: boolean) {}
}

export class SelectUsersPageOrder {
    public static readonly type: UserActionEnum = UserActionEnum.SELECT_USERS_PAGE_ORDER

    public constructor (public readonly order: OrderEnum) {}
}

export class StartUserLoader {
    public static readonly type: UserActionEnum = UserActionEnum.START_USER_LOADER
}

export class StopUserLoader {
    public static readonly type: UserActionEnum = UserActionEnum.STOP_USER_LOADER
}

export class FetchUser {
    public static readonly type: UserActionEnum = UserActionEnum.FETCH_USER

    public constructor (public readonly id: string) {}
}

export class ResetUser {
    public static readonly type: UserActionEnum = UserActionEnum.RESET_USER
}

export class FetchAssignableUserRoles {
    public static readonly type: UserActionEnum = UserActionEnum.FETCH_ASSIGNABLE_USER_ROLES
}

export class UpdateUserRole {
    public static readonly type: UserActionEnum = UserActionEnum.UPDATE_USER_ROLE

    public constructor (public readonly id: string, public readonly role: string | undefined) {}
}

export class BlockUser {
    public static readonly type: UserActionEnum = UserActionEnum.BLOCK_USER

    public constructor (public readonly id: string) {}
}

export class UnblockUser {
    public static readonly type: UserActionEnum = UserActionEnum.UNBLOCK_USER

    public constructor (public readonly id: string) {}
}

export class ImpersonateUser {
    public static readonly type: UserActionEnum = UserActionEnum.IMPERSONATE_USER

    public constructor (public readonly user: UserModel) {}
}

export class DeleteUser {
    public static readonly type: UserActionEnum = UserActionEnum.DELETE_USER

    public constructor (public readonly user: UserModel) {}
}
