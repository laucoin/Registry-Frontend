import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface VehiclesListSearch {
    q: string | undefined
    at: Date | undefined
    status: string | undefined
    isVisible: boolean | undefined
}

export interface VehiclesListSearchModel {
    q: string
    at: Date | null
    status: string
    isVisible: BooleanChoice
}

/**
 * Purpose: Converts the vehicles list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toVehiclesListSearchModel (params: VehiclesListSearch): VehiclesListSearchModel {
    return {
        q: params.q ?? '',
        at: params.at ?? null,
        status: params.status ?? '',
        isVisible: toBooleanChoice( params.isVisible ),
    }
}

/**
 * Purpose: Converts the search form values into the vehicles list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toVehiclesListSearchParams (model: VehiclesListSearchModel): VehiclesListSearch {
    return {
        q: model.q === '' ? undefined : model.q,
        at: model.at ?? undefined,
        status: model.status === '' ? undefined : model.status,
        isVisible: fromBooleanChoice( model.isVisible ),
    }
}
