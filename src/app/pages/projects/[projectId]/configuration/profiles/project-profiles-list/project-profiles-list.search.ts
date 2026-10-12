import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface ProjectProfilesListSearch {
    textSearched: string | undefined
    dateTimeSearched: Date | undefined
    statusSearched: string | undefined
    availabilitySearched: boolean | undefined
}

export interface ProjectProfilesListSearchModel {
    textSearched: string
    dateTimeSearched: Date | null
    statusSearched: string
    availabilitySearched: BooleanChoice
}

/**
 * Purpose: Converts the project profiles list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toProjectProfilesListSearchModel (params: ProjectProfilesListSearch): ProjectProfilesListSearchModel {
    return {
        textSearched: params.textSearched ?? '',
        dateTimeSearched: params.dateTimeSearched ?? null,
        statusSearched: params.statusSearched ?? '',
        availabilitySearched: toBooleanChoice( params.availabilitySearched ),
    }
}

/**
 * Purpose: Converts the search form values into the project profiles list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toProjectProfilesListSearchParams (model: ProjectProfilesListSearchModel): ProjectProfilesListSearch {
    return {
        textSearched: model.textSearched === '' ? undefined : model.textSearched,
        dateTimeSearched: model.dateTimeSearched ?? undefined,
        statusSearched: model.statusSearched === '' ? undefined : model.statusSearched,
        availabilitySearched: fromBooleanChoice( model.availabilitySearched ),
    }
}
