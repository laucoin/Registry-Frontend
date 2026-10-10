import { SearchModel, toSearchModel, toSearchParams } from '@shared/helpers/form/search.form'

export interface VehiclesListSearch {
    textSearched: string | undefined
    dateTimeSearched: Date | undefined
    statusSearched: boolean | undefined
    visibilitySearched: boolean | undefined
}

export type VehiclesListSearchModel = SearchModel<VehiclesListSearch>

export function toVehiclesListSearchModel (params: VehiclesListSearch): VehiclesListSearchModel {
    return toSearchModel<VehiclesListSearch>( params, [ 'textSearched' ] )
}

export function toVehiclesListSearchParams (model: VehiclesListSearchModel): VehiclesListSearch {
    return toSearchParams<VehiclesListSearch>( model )
}
