import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface GroupsListSearch {
    q: string | undefined
    at: Date | undefined
    isPresent: boolean | undefined
    isVisible: boolean | undefined
}

export interface GroupsListSearchModel {
    q: string
    at: Date | null
    isPresent: BooleanChoice
    isVisible: BooleanChoice
}

/**
 * Purpose: Converts the groups list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toGroupsListSearchModel (params: GroupsListSearch): GroupsListSearchModel {
    return {
        q: params.q ?? '',
        at: params.at ?? null,
        isPresent: toBooleanChoice( params.isPresent ),
        isVisible: toBooleanChoice( params.isVisible ),
    }
}

/**
 * Purpose: Converts the search form values into the groups list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toGroupsListSearchParams (model: GroupsListSearchModel): GroupsListSearch {
    return {
        q: model.q === '' ? undefined : model.q,
        at: model.at ?? undefined,
        isPresent: fromBooleanChoice( model.isPresent ),
        isVisible: fromBooleanChoice( model.isVisible ),
    }
}
