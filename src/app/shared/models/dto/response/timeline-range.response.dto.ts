import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';

export interface TimelineRangeResponseDto {
	start: CustomDatetimeModel | null;
	end: CustomDatetimeModel | null;
}
