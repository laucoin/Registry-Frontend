import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'

export interface ProjectDto {
    name: string
    begin: CustomDatetimeModel | undefined
    end: CustomDatetimeModel | undefined
    options: string[] | undefined
}
