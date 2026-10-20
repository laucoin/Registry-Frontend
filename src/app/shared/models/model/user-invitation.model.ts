import { GenericModel } from '@shared/models/model/generic.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'

export interface InvitationProjectModel {
    id: string
    name: string
    begin: CustomDatetimeModel | undefined
    end: CustomDatetimeModel | undefined
    /** Whether the signed-in user marked the project as a favorite; undefined when the backend does not tell. */
    favorite: boolean | undefined
}

/** A profile of the signed-in user seen from the user side: the project summary matters, the user is implicit. */
export interface UserInvitationModel extends GenericModel {
    project: InvitationProjectModel | undefined
    role: SelectOptionModel<string>
    availabilityStatus: SelectOptionModel<AvailabilityStatusEnum>
    status: SelectOptionModel<ProfileStatusEnum>
    startAccess: CustomDatetimeModel | undefined
    endAccess: CustomDatetimeModel | undefined
}
