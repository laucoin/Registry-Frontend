import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum';
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { GenericProjectModel } from '@shared/models/model/generic-project.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';
import { UserModel } from '@shared/models/model/user.model';

export interface ProjectProfileModel extends GenericProjectModel {
	user: UserModel;
	role: SelectOptionModel<string>;
	availabilityStatus: SelectOptionModel<AvailabilityStatusEnum>;
	status: SelectOptionModel<ProfileStatusEnum>;
	startAccess: CustomDatetimeModel | undefined;
	endAccess: CustomDatetimeModel | undefined;
}
