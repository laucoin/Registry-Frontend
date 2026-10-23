import { SearchModel, toSearchModel, toSearchParams } from '@shared/helpers/form/search.form'

export interface VehicleMovementsListSearch {
    typeSearched: string | undefined
    startDateTimeSearched: Date | undefined
    endDateTimeSearched: Date | undefined
    visibilitySearched: boolean | undefined
}

export type VehicleMovementsListSearchModel = SearchModel<VehicleMovementsListSearch>

export function toVehicleMovementsListSearchModel (params: VehicleMovementsListSearch): VehicleMovementsListSearchModel {
    return toSearchModel<VehicleMovementsListSearch>( params, [] )
}

export function toVehicleMovementsListSearchParams (model: VehicleMovementsListSearchModel): VehicleMovementsListSearch {
    return toSearchParams<VehicleMovementsListSearch>( model )
}
