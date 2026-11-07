import { GenericResponseDto } from '@shared/models/dto/response/generic.response.dto';
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum';
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

export interface CurrentProjectProfileResponseDto extends GenericResponseDto {
	role: SelectOptionModel<string>;
	availabilityStatus: SelectOptionModel<AvailabilityStatusEnum>;
	status: SelectOptionModel<ProfileStatusEnum>;
	startAccess: CustomDatetimeModel | undefined;
	endAccess: CustomDatetimeModel | undefined;
}
