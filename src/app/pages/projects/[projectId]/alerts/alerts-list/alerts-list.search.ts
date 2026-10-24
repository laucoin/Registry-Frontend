import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface AlertsListSearch {
    q: string | undefined
    status: string | undefined
    isVisible: boolean | undefined
    from: Date | undefined
    to: Date | undefined
}

export interface AlertsListSearchModel {
    q: string
    status: string
    isVisible: BooleanChoice
    from: Date | null
    to: Date | null
}

/**
 * Purpose: Convertit les paramètres de recherche de la liste des alertes en valeurs liées au formulaire de recherche.
 * Scope: Remplit les paramètres vides avec les valeurs par défaut du formulaire.
 * Limits: Ne valide pas les paramètres.
 */
export function toAlertsListSearchModel (params: AlertsListSearch): AlertsListSearchModel {
    return {
        q: params.q ?? '',
        status: params.status ?? '',
        isVisible: toBooleanChoice( params.isVisible ),
        from: params.from ?? null,
        to: params.to ?? null,
    }
}

/**
 * Purpose: Convertit les valeurs du formulaire de recherche en paramètres de recherche de la liste des alertes.
 * Scope: Transforme les valeurs vides du formulaire en paramètres undefined.
 * Limits: Ne valide pas les valeurs du formulaire.
 */
export function toAlertsListSearchParams (model: AlertsListSearchModel): AlertsListSearch {
    return {
        q: model.q === '' ? undefined : model.q,
        status: model.status === '' ? undefined : model.status,
        isVisible: fromBooleanChoice( model.isVisible ),
        from: model.from ?? undefined,
        to: model.to ?? undefined,
    }
}
