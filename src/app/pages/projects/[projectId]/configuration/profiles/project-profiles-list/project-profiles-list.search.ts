import { SearchModel, toSearchModel, toSearchParams } from '@shared/helpers/form/search.form'

export interface ProjectProfilesListSearch {
    textSearched: string | undefined
    dateTimeSearched: Date | undefined
    statusSearched: string | undefined
    availabilitySearched: boolean | undefined
}

export type ProjectProfilesListSearchModel = SearchModel<ProjectProfilesListSearch>

export function toProjectProfilesListSearchModel (params: ProjectProfilesListSearch): ProjectProfilesListSearchModel {
    return toSearchModel<ProjectProfilesListSearch>( params, [ 'textSearched' ] )
}

export function toProjectProfilesListSearchParams (model: ProjectProfilesListSearchModel): ProjectProfilesListSearch {
    return toSearchParams<ProjectProfilesListSearch>( model )
}
