import { SearchModel, toSearchModel, toSearchParams } from '@shared/helpers/form/search.form'

export interface ProjectsListSearch {
    textSearched: string | undefined
    dateTimeSearched: Date | undefined
    withProfile: boolean | undefined
    visibilitySearched: boolean | undefined
}

export type ProjectsListSearchModel = SearchModel<ProjectsListSearch>

export function toProjectsListSearchModel (params: ProjectsListSearch): ProjectsListSearchModel {
    return toSearchModel<ProjectsListSearch>( params, [ 'textSearched' ] )
}

export function toProjectsListSearchParams (model: ProjectsListSearchModel): ProjectsListSearch {
    return toSearchParams<ProjectsListSearch>( model )
}
