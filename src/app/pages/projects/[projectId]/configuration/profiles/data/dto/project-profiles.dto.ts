import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';

export interface ProjectProfilesDto {
	emails: string[];
	role: string;
	startAccess: CustomDatetimeModel | undefined;
	endAccess: CustomDatetimeModel | undefined;
}
