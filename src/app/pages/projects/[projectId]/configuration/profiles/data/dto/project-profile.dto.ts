import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'

export interface ProjectProfileDto {
    role: string,
    startAccess: CustomDatetimeModel | undefined,
    endAccess: CustomDatetimeModel | undefined,
}
