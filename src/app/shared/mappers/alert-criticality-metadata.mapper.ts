import { AlertCriticalityMetadataResponseDto } from '@shared/models/dto/response/alert-criticality-metadata.response.dto'
import { AlertCriticalityMetadataModel } from '@shared/models/model/alert-criticality-metadata.model'

/**
 * Purpose: Convertit la réponse de métadonnées de criticité d'alerte du backend en son modèle.
 * Scope: Copie les niveaux et la phrase décrivant comment la criticité est calculée.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class AlertCriticalityMetadataMapper {
    public static toModel (dto: AlertCriticalityMetadataResponseDto): AlertCriticalityMetadataModel {
        return { levels: dto.levels, rule: dto.rule }
    }
}
