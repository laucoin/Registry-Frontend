import { SearchModel, toSearchModel, toSearchParams } from '@shared/helpers/form/search.form'

export interface GroupMemberListSearch {
    textSearched: string | undefined
    statusSearched: string | undefined
    visibilitySearched: boolean | undefined
}

export type GroupMemberListSearchModel = SearchModel<GroupMemberListSearch>

export function toGroupMemberListSearchModel (params: GroupMemberListSearch): GroupMemberListSearchModel {
    return toSearchModel<GroupMemberListSearch>( params, [ 'textSearched' ] )
}

export function toGroupMemberListSearchParams (model: GroupMemberListSearchModel): GroupMemberListSearch {
    return toSearchParams<GroupMemberListSearch>( model )
}
