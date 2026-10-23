import { SearchModel, toSearchModel, toSearchParams } from '@shared/helpers/form/search.form'

export interface MovementsListSearch {
    typeSearched: string | undefined
    startDateTimeSearched: Date | undefined
    endDateTimeSearched: Date | undefined
    visibilitySearched: boolean | undefined
}

export type MovementsListSearchModel = SearchModel<MovementsListSearch>

export function toMovementsListSearchModel (params: MovementsListSearch): MovementsListSearchModel {
    return toSearchModel<MovementsListSearch>( params, [] )
}

export function toMovementsListSearchParams (model: MovementsListSearchModel): MovementsListSearch {
    return toSearchParams<MovementsListSearch>( model )
}
