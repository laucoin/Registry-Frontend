import { VehicleStatusResponseDto } from '@shared/models/dto/response/vehicle-status.response.dto';
import { VehicleStatusModel } from '@shared/models/model/vehicle-status.model';

/**
 * Objectif: Convertit une réponse VehicleStatus du backend en modèle VehicleStatus.
 * Périmètre: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limites: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
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
