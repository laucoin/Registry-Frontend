import { CustomDatetimeModel } from '../../../../shared/util-model/model/custom-datetime.model'

export interface EventProfileDto {
    role: string,
    startAccess: CustomDatetimeModel | undefined,
    endAccess: CustomDatetimeModel | undefined,
}
