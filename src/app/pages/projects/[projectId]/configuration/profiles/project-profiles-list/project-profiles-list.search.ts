import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface ProjectProfilesListSearch {
    q: string | undefined
    at: Date | undefined
    status: string | undefined
    isAvailable: boolean | undefined
}

export interface ProjectProfilesListSearchModel {
    q: string
    at: Date | null
    status: string
    isAvailable: BooleanChoice
}

/**
 * Purpose: Convertit les paramètres de recherche de la liste des profils de projet en valeurs liées au formulaire de recherche.
 * Scope: Remplit les paramètres vides avec les valeurs par défaut du formulaire.
 * Limits: Ne valide pas les paramètres.
 */
export function toProjectProfilesListSearchModel (params: ProjectProfilesListSearch): ProjectProfilesListSearchModel {
    return {
        q: params.q ?? '',
        at: params.at ?? null,
        status: params.status ?? '',
        isAvailable: toBooleanChoice( params.isAvailable ),
    }
}

/**
 * Purpose: Convertit les valeurs du formulaire de recherche en paramètres de recherche de la liste des profils de projet.
 * Scope: Transforme les valeurs vides du formulaire en paramètres undefined.
 * Limits: Ne valide pas les valeurs du formulaire.
 */
export function toProjectProfilesListSearchParams (model: ProjectProfilesListSearchModel): ProjectProfilesListSearch {
    return {
        q: model.q === '' ? undefined : model.q,
        at: model.at ?? undefined,
        status: model.status === '' ? undefined : model.status,
        isAvailable: fromBooleanChoice( model.isAvailable ),
    }
}
