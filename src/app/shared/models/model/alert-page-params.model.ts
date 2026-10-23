import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'

export interface AlertPageParamsModel {
    resetSearch: boolean
    textSearched: string | undefined
    statusSearched: AlertStatusEnum | undefined
    visibilitySearched: boolean | undefined
    startDateTimeSearched: string | undefined
    endDateTimeSearched: string | undefined
}
