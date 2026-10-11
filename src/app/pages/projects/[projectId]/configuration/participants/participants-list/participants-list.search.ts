import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface ParticipantsListSearch {
    textSearched: string | undefined
    statusSearched: string | undefined
    visibilitySearched: boolean | undefined
}

export interface ParticipantsListSearchModel {
    textSearched: string
    statusSearched: string
    visibilitySearched: BooleanChoice
}

/**
 * Purpose: Converts the participants list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toParticipantsListSearchModel (params: ParticipantsListSearch): ParticipantsListSearchModel {
    return {
        textSearched: params.textSearched ?? '',
        statusSearched: params.statusSearched ?? '',
        visibilitySearched: toBooleanChoice( params.visibilitySearched ),
    }
}

/**
 * Purpose: Converts the search form values into the participants list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toParticipantsListSearchParams (model: ParticipantsListSearchModel): ParticipantsListSearch {
    return {
        textSearched: model.textSearched === '' ? undefined : model.textSearched,
        statusSearched: model.statusSearched === '' ? undefined : model.statusSearched,
        visibilitySearched: fromBooleanChoice( model.visibilitySearched ),
    }
}
