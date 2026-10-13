import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface ParticipantsListSearch {
    q: string | undefined
    status: string | undefined
    isVisible: boolean | undefined
}

export interface ParticipantsListSearchModel {
    q: string
    status: string
    isVisible: BooleanChoice
}

/**
 * Purpose: Converts the participants list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toParticipantsListSearchModel (params: ParticipantsListSearch): ParticipantsListSearchModel {
    return {
        q: params.q ?? '',
        status: params.status ?? '',
        isVisible: toBooleanChoice( params.isVisible ),
    }
}

/**
 * Purpose: Converts the search form values into the participants list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toParticipantsListSearchParams (model: ParticipantsListSearchModel): ParticipantsListSearch {
    return {
        q: model.q === '' ? undefined : model.q,
        status: model.status === '' ? undefined : model.status,
        isVisible: fromBooleanChoice( model.isVisible ),
    }
}
