import { SearchModel, toSearchModel, toSearchParams } from '@shared/helpers/form/search.form'

export interface UsersListSearch {
    textSearched: string | undefined
    visibilitySearched: boolean | undefined
}

export type UsersListSearchModel = SearchModel<UsersListSearch>

export function toUsersListSearchModel (params: UsersListSearch): UsersListSearchModel {
    return toSearchModel<UsersListSearch>( params, [ 'textSearched' ] )
}

export function toUsersListSearchParams (model: UsersListSearchModel): UsersListSearch {
    return toSearchParams<UsersListSearch>( model )
}
