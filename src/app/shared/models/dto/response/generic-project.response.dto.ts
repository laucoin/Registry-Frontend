import { GenericResponseDto } from '@shared/models/dto/response/generic.response.dto'
import { ProjectResponseDto } from '@shared/models/dto/response/project.response.dto'

export interface GenericProjectResponseDto extends GenericResponseDto {
    project: ProjectResponseDto
}
