import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface GroupMemberListSearch {
    textSearched: string | undefined
    statusSearched: string | undefined
    visibilitySearched: boolean | undefined
}

export interface GroupMemberListSearchModel {
    textSearched: string
    statusSearched: string
    visibilitySearched: BooleanChoice
}

/**
 * Purpose: Converts the group members list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toGroupMemberListSearchModel (params: GroupMemberListSearch): GroupMemberListSearchModel {
    return {
        textSearched: params.textSearched ?? '',
        statusSearched: params.statusSearched ?? '',
        visibilitySearched: toBooleanChoice( params.visibilitySearched ),
    }
}

/**
 * Purpose: Converts the search form values into the group members list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toGroupMemberListSearchParams (model: GroupMemberListSearchModel): GroupMemberListSearch {
    return {
        textSearched: model.textSearched === '' ? undefined : model.textSearched,
        statusSearched: model.statusSearched === '' ? undefined : model.statusSearched,
        visibilitySearched: fromBooleanChoice( model.visibilitySearched ),
    }
}
