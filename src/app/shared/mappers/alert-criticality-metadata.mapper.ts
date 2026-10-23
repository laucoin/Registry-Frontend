import { AlertCriticalityMetadataResponseDto } from '@shared/models/dto/response/alert-criticality-metadata.response.dto'
import { AlertCriticalityMetadataModel } from '@shared/models/model/alert-criticality-metadata.model'

/**
 * Purpose: Converts the alert criticality metadata response of the backend into its model.
 * Scope: Copies the levels and the sentence describing how the criticality is computed.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class AlertCriticalityMetadataMapper {
    public static toModel (dto: AlertCriticalityMetadataResponseDto): AlertCriticalityMetadataModel {
        return { levels: dto.levels, rule: dto.rule }
    }
}
