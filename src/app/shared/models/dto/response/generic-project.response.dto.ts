import { GenericResponseDto } from '@shared/models/dto/response/generic.response.dto'

export interface GenericProjectResponseDto extends GenericResponseDto {
    projectId: string
}
