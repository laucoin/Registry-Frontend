import { ProjectStatusModel } from '@shared/models/model/project-status.model'
import { ProjectStatusResponseDto } from '@shared/models/dto/response/project-status.response.dto'

/**
 * Purpose: Converts a ProjectStatus response of the backend into the ProjectStatus model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class ProjectStatusMapper {
    public static toModel (dto: ProjectStatusResponseDto): ProjectStatusModel {
        return {
            registered: dto.registered,
            guests: dto.guests,
            lastRefresh: dto.lastRefresh,
        }
    }
}
