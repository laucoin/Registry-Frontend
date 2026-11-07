import { VehicleStatusResponseDto } from '@shared/models/dto/response/vehicle-status.response.dto';
import { VehicleStatusModel } from '@shared/models/model/vehicle-status.model';

/**
 * Purpose: Convertit une réponse VehicleStatus du backend en modèle VehicleStatus.
 * Scope: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const VehicleStatusMapper = {
	toModel(dto: VehicleStatusResponseDto): VehicleStatusModel {
		return {
			present: dto.present,
			absent: dto.absent,
			lastRefresh: dto.lastRefresh,
		};
	},
} as const;
