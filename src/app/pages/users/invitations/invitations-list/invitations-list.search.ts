import { SearchModel, toSearchModel, toSearchParams } from '@shared/helpers/form/search.form'

export interface InvitationsListSearch {
    textSearched: string | undefined
    dateTimeSearched: Date | undefined
}

export type InvitationsListSearchModel = SearchModel<InvitationsListSearch>

export function toInvitationsListSearchModel (params: InvitationsListSearch): InvitationsListSearchModel {
    return toSearchModel<InvitationsListSearch>( params, [ 'textSearched' ] )
}

export function toInvitationsListSearchParams (model: InvitationsListSearchModel): InvitationsListSearch {
    return toSearchParams<InvitationsListSearch>( model )
}
