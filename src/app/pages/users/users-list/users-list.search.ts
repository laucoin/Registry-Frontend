import { fromBooleanChoice, toBooleanChoice, BooleanChoice } from '@shared/helpers/form/boolean-choice'

interface UsersListSearch {
    q: string | undefined
    isVisible: boolean | undefined
}

export interface UsersListSearchModel {
    q: string
    isVisible: BooleanChoice
}

/**
 * Purpose: Converts the users list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toUsersListSearchModel (params: UsersListSearch): UsersListSearchModel {
    return {
        q: params.q ?? '',
        isVisible: toBooleanChoice( params.isVisible ),
    }
}

/**
 * Purpose: Converts the search form values into the users list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toUsersListSearchParams (model: UsersListSearchModel): UsersListSearch {
    return {
        q: model.q === '' ? undefined : model.q,
        isVisible: fromBooleanChoice( model.isVisible ),
    }
}
