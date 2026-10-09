import { SearchModel, toSearchModel, toSearchParams } from '@shared/helpers/form/search.form'

export interface ActivitiesListSearch {
    textSearched: string | undefined
    dateTimeSearched: Date | undefined
    availabilitySearched: boolean | undefined
    visibilitySearched: boolean | undefined
}

export type ActivitiesListSearchModel = SearchModel<ActivitiesListSearch>

export function toActivitiesListSearchModel (params: ActivitiesListSearch): ActivitiesListSearchModel {
    return toSearchModel<ActivitiesListSearch>( params, [ 'textSearched' ] )
}

export function toActivitiesListSearchParams (model: ActivitiesListSearchModel): ActivitiesListSearch {
    return toSearchParams<ActivitiesListSearch>( model )
}
