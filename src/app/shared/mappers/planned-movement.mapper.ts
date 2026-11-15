import { MovementReasonMapper } from '@shared/mappers/movement-reason.mapper';
import { ParticipantMapper } from '@shared/mappers/participant.mapper';
import { PlannedMovementResponseDto } from '@shared/models/dto/response/planned-movement.response.dto';
import { PlannedMovementModel } from '@shared/models/model/planned-movement.model';

/**
 * Objectif: Convertit une réponse de mouvement prévu du backend en modèle de mouvement prévu.
 * Périmètre: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limites: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const PlannedMovementMapper = {
	toModel(dto: PlannedMovementResponseDto): PlannedMovementModel {
		return {
			type: dto.type,
			reason: dto.reason ? MovementReasonMapper.toModel(dto.reason) : undefined,
			contentType: dto.contentType,
			plannedAt: dto.plannedAt,
			poolName: dto.poolName,
			participants: dto.participants.map(ParticipantMapper.toModel),
		};
	},
} as const;
