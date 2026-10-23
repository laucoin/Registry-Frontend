import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface ProjectProfilesListSearch {
    q: string | undefined
    at: Date | undefined
    status: string | undefined
    isAvailable: boolean | undefined
}

export interface ProjectProfilesListSearchModel {
    q: string
    at: Date | null
    status: string
    isAvailable: BooleanChoice
}

/**
 * Purpose: Converts the project profiles list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toProjectProfilesListSearchModel (params: ProjectProfilesListSearch): ProjectProfilesListSearchModel {
    return {
        q: params.q ?? '',
        at: params.at ?? null,
        status: params.status ?? '',
        isAvailable: toBooleanChoice( params.isAvailable ),
    }
}

/**
 * Purpose: Converts the search form values into the project profiles list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toProjectProfilesListSearchParams (model: ProjectProfilesListSearchModel): ProjectProfilesListSearch {
    return {
        q: model.q === '' ? undefined : model.q,
        at: model.at ?? undefined,
        status: model.status === '' ? undefined : model.status,
        isAvailable: fromBooleanChoice( model.isAvailable ),
    }
}
