import { SearchModel, toSearchModel, toSearchParams } from '@shared/helpers/form/search.form'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'

export interface AlertsListSearch {
    textSearched: string | undefined
    statusSearched: AlertStatusEnum | undefined
    visibilitySearched: boolean | undefined
    startDateTimeSearched: Date | undefined
    endDateTimeSearched: Date | undefined
}

export type AlertsListSearchModel = SearchModel<AlertsListSearch>

export function toAlertsListSearchModel (params: AlertsListSearch): AlertsListSearchModel {
    return toSearchModel<AlertsListSearch>( params, [ 'textSearched' ] )
}

export function toAlertsListSearchParams (model: AlertsListSearchModel): AlertsListSearch {
    return toSearchParams<AlertsListSearch>( model )
}
