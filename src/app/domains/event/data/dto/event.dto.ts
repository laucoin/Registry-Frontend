import { CustomDatetimeModel } from '../../../../shared/util-model/model/custom-datetime.model'

export interface EventDto {
    name: string
    begin: CustomDatetimeModel | undefined
    end: CustomDatetimeModel | undefined
    options: string[] | undefined
}
