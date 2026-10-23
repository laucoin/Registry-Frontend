import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface ActivitiesListSearch {
    q: string | undefined
    at: Date | undefined
    isAvailable: boolean | undefined
    isVisible: boolean | undefined
}

export interface ActivitiesListSearchModel {
    q: string
    at: Date | null
    isAvailable: BooleanChoice
    isVisible: BooleanChoice
}

/**
 * Purpose: Converts the activities list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toActivitiesListSearchModel (params: ActivitiesListSearch): ActivitiesListSearchModel {
    return {
        q: params.q ?? '',
        at: params.at ?? null,
        isAvailable: toBooleanChoice( params.isAvailable ),
        isVisible: toBooleanChoice( params.isVisible ),
    }
}

/**
 * Purpose: Converts the search form values into the activities list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toActivitiesListSearchParams (model: ActivitiesListSearchModel): ActivitiesListSearch {
    return {
        q: model.q === '' ? undefined : model.q,
        at: model.at ?? undefined,
        isAvailable: fromBooleanChoice( model.isAvailable ),
        isVisible: fromBooleanChoice( model.isVisible ),
    }
}
