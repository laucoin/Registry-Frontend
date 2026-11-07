import { ParticipantMapper } from '@shared/mappers/participant.mapper';
import { VehicleMapper } from '@shared/mappers/vehicle.mapper';
import { MovementContentResponseDto } from '@shared/models/dto/response/movement-content.response.dto';
import { MovementContentModel } from '@shared/models/model/movement-content.model';

/**
 * Purpose: Convertit une réponse MovementContent du backend en modèle MovementContent.
 * Scope: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const MovementContentMapper = {
	toModel(dto: MovementContentResponseDto): MovementContentModel {
		return {
			poolName: dto.poolName,
			participant: ParticipantMapper.toModel(dto.participant),
			vehicle: dto.vehicle ? VehicleMapper.toModel(dto.vehicle) : undefined,
		};
	},
} as const;
