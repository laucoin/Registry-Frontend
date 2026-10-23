import { SearchModel, toSearchModel, toSearchParams } from '@shared/helpers/form/search.form'

export interface ParticipantMovementsListSearch {
    typeSearched: string | undefined
    startDateTimeSearched: Date | undefined
    endDateTimeSearched: Date | undefined
    visibilitySearched: boolean | undefined
}

export type ParticipantMovementsListSearchModel = SearchModel<ParticipantMovementsListSearch>

export function toParticipantMovementsListSearchModel (params: ParticipantMovementsListSearch): ParticipantMovementsListSearchModel {
    return toSearchModel<ParticipantMovementsListSearch>( params, [] )
}

export function toParticipantMovementsListSearchParams (model: ParticipantMovementsListSearchModel): ParticipantMovementsListSearch {
    return toSearchParams<ParticipantMovementsListSearch>( model )
}
