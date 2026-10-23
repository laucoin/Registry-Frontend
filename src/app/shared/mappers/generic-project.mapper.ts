import { GenericProjectModel } from '@shared/models/model/generic-project.model'
import { GenericProjectResponseDto } from '@shared/models/dto/response/generic-project.response.dto'
import { GenericMapper } from '@shared/mappers/generic.mapper'
import { ProjectMapper } from '@shared/mappers/project.mapper'

/**
 * Purpose: Converts a GenericProject response of the backend into the GenericProject model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class GenericProjectMapper {
    public static toModel (dto: GenericProjectResponseDto): GenericProjectModel {
        return {
            ...GenericMapper.toModel( dto ),
            project: ProjectMapper.toModel( dto.project ),
        }
    }
}
