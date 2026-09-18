import { GenericReaderResponse } from '@shared/mappers/common/generic-reader.response';

export interface GenericProjectReaderResponse extends GenericReaderResponse {
	project: {
		name: string;
	};
}
