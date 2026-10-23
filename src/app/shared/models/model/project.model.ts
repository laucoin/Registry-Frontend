import { CurrentProjectProfileModel } from '@shared/models/model/current-project-profile.model'
import { GenericModel } from '@shared/models/model/generic.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'

export interface ProjectCountsModel {
    participants: number
    groups: number
    acceptedProfiles: number
    vehicles: number | undefined
    activities: number | undefined
    activeAlerts: number | undefined
}

export interface ProjectModel extends GenericModel {
    name: string,
    status: SelectOptionModel<AvailabilityStatusEnum> | undefined
    begin: CustomDatetimeModel | undefined,
    end: CustomDatetimeModel | undefined,
    options: SelectOptionModel<ProjectOptionEnum>[] | undefined,
    counts: ProjectCountsModel | undefined,
    /** Whether the signed-in user marked the project as a favorite; undefined when the backend does not tell. */
    favorite: boolean | undefined,
    /** The signed-in user's profile on this project, when the user has one. */
    profile: CurrentProjectProfileModel | undefined,
}
