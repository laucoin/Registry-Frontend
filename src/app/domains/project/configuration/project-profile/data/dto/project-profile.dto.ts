import { CustomDatetimeModel } from '../../../../../../shared/util-model/model/custom-datetime.model'

export interface ProjectProfileDto {
    role: string,
    startAccess: CustomDatetimeModel | undefined,
    endAccess: CustomDatetimeModel | undefined,
}
