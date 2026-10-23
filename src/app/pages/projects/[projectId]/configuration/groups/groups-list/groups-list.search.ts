import { SearchModel, toSearchModel, toSearchParams } from '@shared/helpers/form/search.form'

export interface GroupsListSearch {
    textSearched: string | undefined
    dateTimeSearched: Date | undefined
    presenceSearched: boolean | undefined
    visibilitySearched: boolean | undefined
}

export type GroupsListSearchModel = SearchModel<GroupsListSearch>

export function toGroupsListSearchModel (params: GroupsListSearch): GroupsListSearchModel {
    return toSearchModel<GroupsListSearch>( params, [ 'textSearched' ] )
}

export function toGroupsListSearchParams (model: GroupsListSearchModel): GroupsListSearch {
    return toSearchParams<GroupsListSearch>( model )
}
