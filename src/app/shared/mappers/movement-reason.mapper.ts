import { MovementReasonResponseDto } from '@shared/models/dto/response/movement-reason.response.dto'
import { MovementReasonModel } from '@pages/projects/[projectId]/movements/data/model/movement-reason.model'

/**
 * Purpose: Converts a movement reason response of the backend into the movement reason model.
 * Scope: Copies the select item fields together with the reason type and kind.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class MovementReasonMapper {
    public static toModel (dto: MovementReasonResponseDto): MovementReasonModel {
        return { ...dto, type: dto.type, kind: dto.kind }
    }
}
