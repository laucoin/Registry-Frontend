import { ProjectModel } from '@shared/models/model/project.model'
import { ProjectResponseDto } from '@shared/models/dto/response/project.response.dto'
import { GenericMapper } from '@shared/mappers/generic.mapper'

/**
 * Purpose: Converts a Project response of the backend into the Project model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class ProjectMapper {
    public static toModel (dto: ProjectResponseDto): ProjectModel {
        return {
            ...GenericMapper.toModel( dto ),
            name: dto.name,
            status: dto.status,
            begin: dto.begin,
            end: dto.end,
            options: dto.options,
        }
    }
}
