import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'

export interface UserProjectProfilePageParamsModel {
    resetSearch: boolean
    q: string | undefined
    isAvailable: boolean | undefined
    status: ProfileStatusEnum | undefined
    at: string | undefined
}
