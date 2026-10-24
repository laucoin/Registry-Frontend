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
 * Purpose: Convertit les paramètres de recherche de la liste des groupes en valeurs liées au formulaire de recherche.
 * Scope: Remplit les paramètres vides avec les valeurs par défaut du formulaire.
 * Limits: Ne valide pas les paramètres.
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
 * Purpose: Convertit les valeurs du formulaire de recherche en paramètres de recherche de la liste des groupes.
 * Scope: Transforme les valeurs vides du formulaire en paramètres undefined.
 * Limits: Ne valide pas les valeurs du formulaire.
 */
export function toGroupsListSearchParams (model: GroupsListSearchModel): GroupsListSearch {
    return {
        q: model.q === '' ? undefined : model.q,
        at: model.at ?? undefined,
        isPresent: fromBooleanChoice( model.isPresent ),
        isVisible: fromBooleanChoice( model.isVisible ),
    }
}
