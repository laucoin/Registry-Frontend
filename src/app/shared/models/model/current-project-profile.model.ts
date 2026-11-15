import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum';
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { GenericModel } from '@shared/models/model/generic.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

/** Le profil de l'utilisateur connecté sur un projet : l'utilisateur et le projet sont implicites. */
export interface CurrentProjectProfileModel extends GenericModel {
	role: SelectOptionModel<string>;
	availabilityStatus: SelectOptionModel<AvailabilityStatusEnum>;
	status: SelectOptionModel<ProfileStatusEnum>;
	startAccess: CustomDatetimeModel | undefined;
	endAccess: CustomDatetimeModel | undefined;
}
