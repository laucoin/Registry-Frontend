import { CustomDatetimeModel } from '../../../../shared/util-model/model/custom-datetime.model'

export interface ParticipantDto {
    firstName: string
    lastName: string
    birthday: string
    userId: string | undefined
    groupIds: string[]
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
}
