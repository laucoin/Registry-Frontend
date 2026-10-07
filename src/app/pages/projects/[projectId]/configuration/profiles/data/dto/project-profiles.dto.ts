import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'

export interface ProjectProfilesDto {
    userIds: string[],
    role: string,
    startAccess: CustomDatetimeModel | undefined,
    endAccess: CustomDatetimeModel | undefined,
}
