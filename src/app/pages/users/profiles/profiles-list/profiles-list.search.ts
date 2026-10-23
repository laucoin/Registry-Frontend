import { SearchModel, toSearchModel, toSearchParams } from '@shared/helpers/form/search.form'

export interface ProfilesListSearch {
    textSearched: string | undefined
    dateTimeSearched: Date | undefined
    availabilitySearched: boolean | undefined
}

export type ProfilesListSearchModel = SearchModel<ProfilesListSearch>

export function toProfilesListSearchModel (params: ProfilesListSearch): ProfilesListSearchModel {
    return toSearchModel<ProfilesListSearch>( params, [ 'textSearched' ] )
}

export function toProfilesListSearchParams (model: ProfilesListSearchModel): ProfilesListSearch {
    return toSearchParams<ProfilesListSearch>( model )
}
