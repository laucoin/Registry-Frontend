interface InvitationsListSearch {
    q: string | undefined
    at: Date | undefined
}

export interface InvitationsListSearchModel {
    q: string
    at: Date | null
}

/**
 * Purpose: Converts the invitations list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toInvitationsListSearchModel (params: InvitationsListSearch): InvitationsListSearchModel {
    return {
        q: params.q ?? '',
        at: params.at ?? null,
    }
}

/**
 * Purpose: Converts the search form values into the invitations list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toInvitationsListSearchParams (model: InvitationsListSearchModel): InvitationsListSearch {
    return {
        q: model.q === '' ? undefined : model.q,
        at: model.at ?? undefined,
    }
}
