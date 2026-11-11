import { MovementReasonResponseDto } from '@shared/models/dto/response/movement-reason.response.dto';
import { MovementReasonModel } from '@shared/models/model/movement-reason.model';

/**
 * Objectif: Convertit une réponse de motif de mouvement du backend en modèle de motif de mouvement.
 * Périmètre: Copie les champs du select item ainsi que le type et la nature du motif.
 * Limites: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const MovementReasonMapper = {
	toModel(dto: MovementReasonResponseDto): MovementReasonModel {
		return { ...dto, type: dto.type, kind: dto.kind };
	},
} as const;
