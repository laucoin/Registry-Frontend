import { GenericProjectResponseDto } from '@shared/models/dto/response/generic-project.response.dto';
import { UserResponseDto } from '@shared/models/dto/response/user.response.dto';
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum';
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

export interface ProjectProfileResponseDto extends GenericProjectResponseDto {
	user: UserResponseDto;
	role: SelectOptionModel<string>;
	availabilityStatus: SelectOptionModel<AvailabilityStatusEnum>;
	status: SelectOptionModel<ProfileStatusEnum>;
	startAccess: CustomDatetimeModel | undefined;
	endAccess: CustomDatetimeModel | undefined;
}
