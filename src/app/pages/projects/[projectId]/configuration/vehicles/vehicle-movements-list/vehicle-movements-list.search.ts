import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface VehicleMovementsListSearch {
    typeSearched: string | undefined
    startDateTimeSearched: Date | undefined
    endDateTimeSearched: Date | undefined
    visibilitySearched: boolean | undefined
}

export interface VehicleMovementsListSearchModel {
    typeSearched: string
    startDateTimeSearched: Date | null
    endDateTimeSearched: Date | null
    visibilitySearched: BooleanChoice
}

/**
 * Purpose: Converts the movements search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toVehicleMovementsListSearchModel (params: VehicleMovementsListSearch): VehicleMovementsListSearchModel {
    return {
        typeSearched: params.typeSearched ?? '',
        startDateTimeSearched: params.startDateTimeSearched ?? null,
        endDateTimeSearched: params.endDateTimeSearched ?? null,
        visibilitySearched: toBooleanChoice( params.visibilitySearched ),
    }
}

/**
 * Purpose: Converts the search form values into the movements search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toVehicleMovementsListSearchParams (model: VehicleMovementsListSearchModel): VehicleMovementsListSearch {
    return {
        typeSearched: model.typeSearched === '' ? undefined : model.typeSearched,
        startDateTimeSearched: model.startDateTimeSearched ?? undefined,
        endDateTimeSearched: model.endDateTimeSearched ?? undefined,
        visibilitySearched: fromBooleanChoice( model.visibilitySearched ),
    }
}
