import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface GroupMemberListSearch {
    q: string | undefined
    status: string | undefined
    isVisible: boolean | undefined
}

export interface GroupMemberListSearchModel {
    q: string
    status: string
    isVisible: BooleanChoice
}

/**
 * Purpose: Converts the group members list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toGroupMemberListSearchModel (params: GroupMemberListSearch): GroupMemberListSearchModel {
    return {
        q: params.q ?? '',
        status: params.status ?? '',
        isVisible: toBooleanChoice( params.isVisible ),
    }
}

/**
 * Purpose: Converts the search form values into the group members list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toGroupMemberListSearchParams (model: GroupMemberListSearchModel): GroupMemberListSearch {
    return {
        q: model.q === '' ? undefined : model.q,
        status: model.status === '' ? undefined : model.status,
        isVisible: fromBooleanChoice( model.isVisible ),
    }
}
