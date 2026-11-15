import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum';
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { GenericProjectModel } from '@shared/models/model/generic-project.model';
import { InvitedUserModel } from '@shared/models/model/invited-user.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

export interface ProjectProfileModel extends GenericProjectModel {
	user: InvitedUserModel;
	role: SelectOptionModel<string>;
	availabilityStatus: SelectOptionModel<AvailabilityStatusEnum>;
	status: SelectOptionModel<ProfileStatusEnum>;
	startAccess: CustomDatetimeModel | undefined;
	endAccess: CustomDatetimeModel | undefined;
}
