import { ProjectOptionModel } from '@pages/projects/data/model/project-option.model'
import { ProjectOptionResponseDto } from '@shared/models/dto/response/project-option.response.dto'

/**
 * Purpose: Converts a ProjectOption response of the backend into the ProjectOption model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class ProjectOptionMapper {
    public static toModel (dto: ProjectOptionResponseDto): ProjectOptionModel {
        return {
            value: dto.value,
            label: dto.label,
            ask: dto.ask,
            preRequired: dto.preRequired,
        }
    }
}
