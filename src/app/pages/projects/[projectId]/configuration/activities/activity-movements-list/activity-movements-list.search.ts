import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface ActivityMovementsListSearch {
    type: string | undefined
    from: Date | undefined
    to: Date | undefined
    isVisible: boolean | undefined
}

export interface ActivityMovementsListSearchModel {
    type: string
    from: Date | null
    to: Date | null
    isVisible: BooleanChoice
}

/**
 * Purpose: Convertit les paramètres de recherche des mouvements en valeurs liées au formulaire de recherche.
 * Scope: Remplit les paramètres vides avec les valeurs par défaut du formulaire.
 * Limits: Ne valide pas les paramètres.
 */
export function toActivityMovementsListSearchModel (params: ActivityMovementsListSearch): ActivityMovementsListSearchModel {
    return {
        type: params.type ?? '',
        from: params.from ?? null,
        to: params.to ?? null,
        isVisible: toBooleanChoice( params.isVisible ),
    }
}

/**
 * Purpose: Convertit les valeurs du formulaire de recherche en paramètres de recherche des mouvements.
 * Scope: Transforme les valeurs vides du formulaire en paramètres undefined.
 * Limits: Ne valide pas les valeurs du formulaire.
 */
export function toActivityMovementsListSearchParams (model: ActivityMovementsListSearchModel): ActivityMovementsListSearch {
    return {
        type: model.type === '' ? undefined : model.type,
        from: model.from ?? undefined,
        to: model.to ?? undefined,
        isVisible: fromBooleanChoice( model.isVisible ),
    }
}
