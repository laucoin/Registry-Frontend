import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'

export interface UserProjectProfilePageParamsModel {
    resetSearch: boolean
    textSearched: string | undefined
    availabilitySearched: boolean | undefined
    statusSearched: ProfileStatusEnum | undefined
    dateTimeSearched: string | undefined
}
