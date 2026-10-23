import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface ActivitiesListSearch {
    textSearched: string | undefined
    dateTimeSearched: Date | undefined
    availabilitySearched: boolean | undefined
    visibilitySearched: boolean | undefined
}

export interface ActivitiesListSearchModel {
    textSearched: string
    dateTimeSearched: Date | null
    availabilitySearched: BooleanChoice
    visibilitySearched: BooleanChoice
}

/**
 * Purpose: Converts the activities list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toActivitiesListSearchModel (params: ActivitiesListSearch): ActivitiesListSearchModel {
    return {
        textSearched: params.textSearched ?? '',
        dateTimeSearched: params.dateTimeSearched ?? null,
        availabilitySearched: toBooleanChoice( params.availabilitySearched ),
        visibilitySearched: toBooleanChoice( params.visibilitySearched ),
    }
}

/**
 * Purpose: Converts the search form values into the activities list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toActivitiesListSearchParams (model: ActivitiesListSearchModel): ActivitiesListSearch {
    return {
        textSearched: model.textSearched === '' ? undefined : model.textSearched,
        dateTimeSearched: model.dateTimeSearched ?? undefined,
        availabilitySearched: fromBooleanChoice( model.availabilitySearched ),
        visibilitySearched: fromBooleanChoice( model.visibilitySearched ),
    }
}
