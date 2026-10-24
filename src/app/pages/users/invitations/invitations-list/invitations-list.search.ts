interface InvitationsListSearch {
    q: string | undefined
    at: Date | undefined
}

export interface InvitationsListSearchModel {
    q: string
    at: Date | null
}

/**
 * Purpose: Convertit les paramètres de recherche de la liste des invitations en valeurs liées au formulaire de recherche.
 * Scope: Remplit les paramètres vides avec les valeurs par défaut du formulaire.
 * Limits: Ne valide pas les paramètres.
 */
export function toInvitationsListSearchModel (params: InvitationsListSearch): InvitationsListSearchModel {
    return {
        q: params.q ?? '',
        at: params.at ?? null,
    }
}

/**
 * Purpose: Convertit les valeurs du formulaire de recherche en paramètres de recherche de la liste des invitations.
 * Scope: Transforme les valeurs vides du formulaire en paramètres undefined.
 * Limits: Ne valide pas les valeurs du formulaire.
 */
export function toInvitationsListSearchParams (model: InvitationsListSearchModel): InvitationsListSearch {
    return {
        q: model.q === '' ? undefined : model.q,
        at: model.at ?? undefined,
    }
}
