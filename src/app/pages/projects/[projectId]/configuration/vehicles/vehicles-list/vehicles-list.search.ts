import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface VehiclesListSearch {
    textSearched: string | undefined
    dateTimeSearched: Date | undefined
    statusSearched: string | undefined
    visibilitySearched: boolean | undefined
}

export interface VehiclesListSearchModel {
    textSearched: string
    dateTimeSearched: Date | null
    statusSearched: string
    visibilitySearched: BooleanChoice
}

/**
 * Purpose: Converts the vehicles list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toVehiclesListSearchModel (params: VehiclesListSearch): VehiclesListSearchModel {
    return {
        textSearched: params.textSearched ?? '',
        dateTimeSearched: params.dateTimeSearched ?? null,
        statusSearched: params.statusSearched ?? '',
        visibilitySearched: toBooleanChoice( params.visibilitySearched ),
    }
}

/**
 * Purpose: Converts the search form values into the vehicles list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toVehiclesListSearchParams (model: VehiclesListSearchModel): VehiclesListSearch {
    return {
        textSearched: model.textSearched === '' ? undefined : model.textSearched,
        dateTimeSearched: model.dateTimeSearched ?? undefined,
        statusSearched: model.statusSearched === '' ? undefined : model.statusSearched,
        visibilitySearched: fromBooleanChoice( model.visibilitySearched ),
    }
}
