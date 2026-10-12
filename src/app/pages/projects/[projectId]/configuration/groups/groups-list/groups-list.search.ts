import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface GroupsListSearch {
    textSearched: string | undefined
    dateTimeSearched: Date | undefined
    presenceSearched: boolean | undefined
    visibilitySearched: boolean | undefined
}

export interface GroupsListSearchModel {
    textSearched: string
    dateTimeSearched: Date | null
    presenceSearched: BooleanChoice
    visibilitySearched: BooleanChoice
}

/**
 * Purpose: Converts the groups list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toGroupsListSearchModel (params: GroupsListSearch): GroupsListSearchModel {
    return {
        textSearched: params.textSearched ?? '',
        dateTimeSearched: params.dateTimeSearched ?? null,
        presenceSearched: toBooleanChoice( params.presenceSearched ),
        visibilitySearched: toBooleanChoice( params.visibilitySearched ),
    }
}

/**
 * Purpose: Converts the search form values into the groups list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toGroupsListSearchParams (model: GroupsListSearchModel): GroupsListSearch {
    return {
        textSearched: model.textSearched === '' ? undefined : model.textSearched,
        dateTimeSearched: model.dateTimeSearched ?? undefined,
        presenceSearched: fromBooleanChoice( model.presenceSearched ),
        visibilitySearched: fromBooleanChoice( model.visibilitySearched ),
    }
}
