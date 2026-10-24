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
    /** Indique si l'utilisateur connecté a marqué le projet comme favori ; undefined quand le backend ne le dit pas. */
    favorite: boolean | undefined
}

/** Un profil de l'utilisateur connecté vu côté utilisateur : le résumé du projet compte, l'utilisateur est implicite. */
export interface UserInvitationModel extends GenericModel {
    project: InvitationProjectModel | undefined
    role: SelectOptionModel<string>
    availabilityStatus: SelectOptionModel<AvailabilityStatusEnum>
    status: SelectOptionModel<ProfileStatusEnum>
    startAccess: CustomDatetimeModel | undefined
    endAccess: CustomDatetimeModel | undefined
}
