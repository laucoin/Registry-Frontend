import { fromBooleanChoice, toBooleanChoice, BooleanChoice } from '@shared/helpers/form/boolean-choice'

interface UsersListSearch {
    textSearched: string | undefined
    visibilitySearched: boolean | undefined
}

export interface UsersListSearchModel {
    textSearched: string
    visibilitySearched: BooleanChoice
}

/**
 * Purpose: Converts the users list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toUsersListSearchModel (params: UsersListSearch): UsersListSearchModel {
    return {
        textSearched: params.textSearched ?? '',
        visibilitySearched: toBooleanChoice( params.visibilitySearched ),
    }
}

/**
 * Purpose: Converts the search form values into the users list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toUsersListSearchParams (model: UsersListSearchModel): UsersListSearch {
    return {
        textSearched: model.textSearched === '' ? undefined : model.textSearched,
        visibilitySearched: fromBooleanChoice( model.visibilitySearched ),
    }
}
