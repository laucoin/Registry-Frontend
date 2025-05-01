import { CustomDatetimeModel } from '../../../../../../shared/util-model/model/custom-datetime.model'

export interface GroupDto {
    name: string
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
    members: string[]
}
