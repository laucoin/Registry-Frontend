import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice'

interface VehiclesListSearch {
    q: string | undefined
    at: Date | undefined
    status: string | undefined
    isVisible: boolean | undefined
}

export interface VehiclesListSearchModel {
    q: string
    at: Date | null
    status: string
    isVisible: BooleanChoice
}

/**
 * Purpose: Convertit les paramètres de recherche de la liste des véhicules en valeurs liées au formulaire de recherche.
 * Scope: Remplit les paramètres vides avec les valeurs par défaut du formulaire.
 * Limits: Ne valide pas les paramètres.
 */
export function toVehiclesListSearchModel (params: VehiclesListSearch): VehiclesListSearchModel {
    return {
        q: params.q ?? '',
        at: params.at ?? null,
        status: params.status ?? '',
        isVisible: toBooleanChoice( params.isVisible ),
    }
}

/**
 * Purpose: Convertit les valeurs du formulaire de recherche en paramètres de recherche de la liste des véhicules.
 * Scope: Transforme les valeurs vides du formulaire en paramètres undefined.
 * Limits: Ne valide pas les valeurs du formulaire.
 */
export function toVehiclesListSearchParams (model: VehiclesListSearchModel): VehiclesListSearch {
    return {
        q: model.q === '' ? undefined : model.q,
        at: model.at ?? undefined,
        status: model.status === '' ? undefined : model.status,
        isVisible: fromBooleanChoice( model.isVisible ),
    }
}
