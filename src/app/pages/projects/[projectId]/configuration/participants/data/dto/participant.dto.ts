import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'

export interface ParticipantDto {
    id?: string | undefined
    firstName: string
    lastName: string
    birthday: string
    userId?: string | undefined
    groupIds?: string[]
    startAvailability?: CustomDatetimeModel | undefined
    endAvailability?: CustomDatetimeModel | undefined
}
