import { CustomDatetimeModel } from '../../../../shared/util-model/model/custom-datetime.model'

export interface EventProfilesDto {
    userIds: string[],
    role: string,
    startAccess: CustomDatetimeModel | undefined,
    endAccess: CustomDatetimeModel | undefined,
}
