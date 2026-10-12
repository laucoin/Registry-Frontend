import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface ProfilesListSearch {
    textSearched: string | undefined
    dateTimeSearched: Date | undefined
    availabilitySearched: boolean | undefined
}

export interface ProfilesListSearchModel {
    textSearched: string
    dateTimeSearched: Date | null
    availabilitySearched: BooleanChoice
}

/**
 * Purpose: Converts the profiles list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toProfilesListSearchModel (params: ProfilesListSearch): ProfilesListSearchModel {
    return {
        textSearched: params.textSearched ?? '',
        dateTimeSearched: params.dateTimeSearched ?? null,
        availabilitySearched: toBooleanChoice( params.availabilitySearched ),
    }
}

/**
 * Purpose: Converts the search form values into the profiles list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toProfilesListSearchParams (model: ProfilesListSearchModel): ProfilesListSearch {
    return {
        textSearched: model.textSearched === '' ? undefined : model.textSearched,
        dateTimeSearched: model.dateTimeSearched ?? undefined,
        availabilitySearched: fromBooleanChoice( model.availabilitySearched ),
    }
}
