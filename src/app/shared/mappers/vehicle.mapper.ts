import { GenericMapper } from '@shared/mappers/generic.mapper';
import { VehicleResponseDto } from '@shared/models/dto/response/vehicle.response.dto';
import { VehicleModel } from '@shared/models/model/vehicle.model';

/**
 * Purpose: Convertit une réponse Vehicle du backend en modèle Vehicle.
 * Scope: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const VehicleMapper = {
	toModel(dto: VehicleResponseDto): VehicleModel {
		return {
			...GenericMapper.toModel(dto),
			licensePlate: dto.licensePlate,
			brand: dto.brand,
			model: dto.model,
			status: dto.status,
			startAvailability: dto.startAvailability,
			endAvailability: dto.endAvailability,
		};
	},
} as const;
