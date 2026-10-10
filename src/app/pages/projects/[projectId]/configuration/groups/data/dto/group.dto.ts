import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'

export interface GroupDto {
    name: string
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
    members: string[]
}
