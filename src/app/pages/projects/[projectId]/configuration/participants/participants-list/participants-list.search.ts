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
 * Purpose: Convertit les paramètres de recherche de la liste des participants en valeurs liées au formulaire de recherche.
 * Scope: Remplit les paramètres vides avec les valeurs par défaut du formulaire.
 * Limits: Ne valide pas les paramètres.
 */
export function toParticipantsListSearchModel (params: ParticipantsListSearch): ParticipantsListSearchModel {
    return {
        q: params.q ?? '',
        status: params.status ?? '',
        isVisible: toBooleanChoice( params.isVisible ),
    }
}

/**
 * Purpose: Convertit les valeurs du formulaire de recherche en paramètres de recherche de la liste des participants.
 * Scope: Transforme les valeurs vides du formulaire en paramètres undefined.
 * Limits: Ne valide pas les valeurs du formulaire.
 */
export function toParticipantsListSearchParams (model: ParticipantsListSearchModel): ParticipantsListSearch {
    return {
        q: model.q === '' ? undefined : model.q,
        status: model.status === '' ? undefined : model.status,
        isVisible: fromBooleanChoice( model.isVisible ),
    }
}
