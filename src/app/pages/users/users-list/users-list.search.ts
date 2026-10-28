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
 * Purpose: Convertit les paramètres de recherche de la liste des utilisateurs en valeurs liées au formulaire de recherche.
 * Scope: Remplit les paramètres vides avec les valeurs par défaut du formulaire.
 * Limits: Ne valide pas les paramètres.
 */
export function toUsersListSearchModel (params: UsersListSearch): UsersListSearchModel {
    return {
        q: params.q ?? '',
        isVisible: toBooleanChoice( params.isVisible ),
    }
}

/**
 * Purpose: Convertit les valeurs du formulaire de recherche en paramètres de recherche de la liste des utilisateurs.
 * Scope: Transforme les valeurs vides du formulaire en paramètres undefined.
 * Limits: Ne valide pas les valeurs du formulaire.
 */
export function toUsersListSearchParams (model: UsersListSearchModel): UsersListSearch {
    return {
        q: model.q === '' ? undefined : model.q,
        isVisible: fromBooleanChoice( model.isVisible ),
    }
}
