import { EventProfileModel } from '../../../../shared/util-model/model/event-profile.model'

export interface CreatedEventProfiles {
    profiles: EventProfileModel[]
    notCreatedUserIds: string[]
}
