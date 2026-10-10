import { SearchModel, toSearchModel, toSearchParams } from '@shared/helpers/form/search.form'

export interface ParticipantsListSearch {
    textSearched: string | undefined
    statusSearched: string | undefined
    visibilitySearched: boolean | undefined
}

export type ParticipantsListSearchModel = SearchModel<ParticipantsListSearch>

export function toParticipantsListSearchModel (params: ParticipantsListSearch): ParticipantsListSearchModel {
    return toSearchModel<ParticipantsListSearch>( params, [ 'textSearched' ] )
}

export function toParticipantsListSearchParams (model: ParticipantsListSearchModel): ParticipantsListSearch {
    return toSearchParams<ParticipantsListSearch>( model )
}
