import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface ProfilesListSearch {
    q: string | undefined
    at: Date | undefined
    isAvailable: boolean | undefined
}

export interface ProfilesListSearchModel {
    q: string
    at: Date | null
    isAvailable: BooleanChoice
}

/**
 * Purpose: Converts the profiles list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toProfilesListSearchModel (params: ProfilesListSearch): ProfilesListSearchModel {
    return {
        q: params.q ?? '',
        at: params.at ?? null,
        isAvailable: toBooleanChoice( params.isAvailable ),
    }
}

/**
 * Purpose: Converts the search form values into the profiles list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toProfilesListSearchParams (model: ProfilesListSearchModel): ProfilesListSearch {
    return {
        q: model.q === '' ? undefined : model.q,
        at: model.at ?? undefined,
        isAvailable: fromBooleanChoice( model.isAvailable ),
    }
}
