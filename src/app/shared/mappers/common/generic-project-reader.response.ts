import { GenericReaderResponse } from '@shared/mappers/common/generic-reader.response';
import { ProjectResponse } from '@shared/mappers/project.mapper';

export interface GenericProjectReaderResponse extends GenericReaderResponse {
	project: ProjectResponse;
}
