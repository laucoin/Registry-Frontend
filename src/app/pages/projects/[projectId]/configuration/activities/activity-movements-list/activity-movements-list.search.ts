import { SearchModel, toSearchModel, toSearchParams } from '@shared/helpers/form/search.form'

export interface ActivityMovementsListSearch {
    typeSearched: string | undefined
    startDateTimeSearched: Date | undefined
    endDateTimeSearched: Date | undefined
    visibilitySearched: boolean | undefined
}

export type ActivityMovementsListSearchModel = SearchModel<ActivityMovementsListSearch>

export function toActivityMovementsListSearchModel (params: ActivityMovementsListSearch): ActivityMovementsListSearchModel {
    return toSearchModel<ActivityMovementsListSearch>( params, [] )
}

export function toActivityMovementsListSearchParams (model: ActivityMovementsListSearchModel): ActivityMovementsListSearch {
    return toSearchParams<ActivityMovementsListSearch>( model )
}
