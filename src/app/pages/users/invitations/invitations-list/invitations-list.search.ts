interface InvitationsListSearch {
    textSearched: string | undefined
    dateTimeSearched: Date | undefined
}

export interface InvitationsListSearchModel {
    textSearched: string
    dateTimeSearched: Date | null
}

/**
 * Purpose: Converts the invitations list search parameters into the values bound to the search form.
 * Scope: Fills the empty parameters with the form defaults.
 * Limits: Does not validate the parameters.
 */
export function toInvitationsListSearchModel (params: InvitationsListSearch): InvitationsListSearchModel {
    return {
        textSearched: params.textSearched ?? '',
        dateTimeSearched: params.dateTimeSearched ?? null,
    }
}

/**
 * Purpose: Converts the search form values into the invitations list search parameters.
 * Scope: Turns the empty form values into undefined parameters.
 * Limits: Does not validate the form values.
 */
export function toInvitationsListSearchParams (model: InvitationsListSearchModel): InvitationsListSearch {
    return {
        textSearched: model.textSearched === '' ? undefined : model.textSearched,
        dateTimeSearched: model.dateTimeSearched ?? undefined,
    }
}
