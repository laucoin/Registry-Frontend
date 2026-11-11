import { AlertCriticalityMetadataResponseDto } from '@shared/models/dto/response/alert-criticality-metadata.response.dto';
import { AlertCriticalityMetadataModel } from '@shared/models/model/alert-criticality-metadata.model';

/**
 * Objectif: Convertit la réponse de métadonnées de criticité d'alerte du backend en son modèle.
 * Périmètre: Copie les niveaux et la phrase décrivant comment la criticité est calculée.
 * Limites: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const AlertCriticalityMetadataMapper = {
	toModel(dto: AlertCriticalityMetadataResponseDto): AlertCriticalityMetadataModel {
		return { levels: dto.levels, rule: dto.rule };
	},
} as const;
