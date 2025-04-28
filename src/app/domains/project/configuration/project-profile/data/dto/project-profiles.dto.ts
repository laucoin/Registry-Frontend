import { CustomDatetimeModel } from '../../../../../../shared/util-model/model/custom-datetime.model'

export interface ProjectProfilesDto {
    userIds: string[],
    role: string,
    startAccess: CustomDatetimeModel | undefined,
    endAccess: CustomDatetimeModel | undefined,
}
