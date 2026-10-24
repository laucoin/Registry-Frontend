import { fromBooleanChoice, toBooleanChoice, BooleanChoice } from '@shared/helpers/form/boolean-choice'

interface ProjectsListSearch {
    q: string | undefined
    at: Date | undefined
    isVisible: boolean | undefined
    isFavorite: boolean | undefined
    withProfile: boolean | undefined
}

export interface ProjectsListSearchModel {
    q: string
    at: Date | null
    isVisible: BooleanChoice
    isFavorite: BooleanChoice
    withProfile: BooleanChoice
}

/**
 * Purpose: Convertit les paramètres de recherche de la liste des projets en valeurs liées au formulaire de recherche.
 * Scope: Remplit les paramètres vides avec les valeurs par défaut du formulaire.
 * Limits: Ne valide pas les paramètres.
 */
export function toProjectsListSearchModel (params: ProjectsListSearch): ProjectsListSearchModel {
    return {
        q: params.q ?? '',
        at: params.at ?? null,
        isVisible: toBooleanChoice(params.isVisible),
        isFavorite: toBooleanChoice(params.isFavorite),
        withProfile: toBooleanChoice(params.withProfile),
    }
}

/**
 * Purpose: Convertit les valeurs du formulaire de recherche en paramètres de recherche de la liste des projets.
 * Scope: Transforme les valeurs vides du formulaire en paramètres undefined.
 * Limits: Ne valide pas les valeurs du formulaire.
 */
export function toProjectsListSearchParams (model: ProjectsListSearchModel): ProjectsListSearch {
    return {
        q: model.q === '' ? undefined : model.q,
        at: model.at ?? undefined,
        isVisible: fromBooleanChoice(model.isVisible),
        isFavorite: fromBooleanChoice(model.isFavorite),
        withProfile: fromBooleanChoice(model.withProfile),
    }
}
