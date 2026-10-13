import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'

export interface ProjectProfilePageParamsModel {
    resetSearch: boolean
    q: string | undefined
    isAvailable: boolean | undefined
    status: ProfileStatusEnum | undefined
    at: string | undefined
}
