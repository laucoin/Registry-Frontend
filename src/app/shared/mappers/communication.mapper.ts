import { AlertMapper } from '@shared/mappers/alert.mapper';
import { GenericMapper } from '@shared/mappers/generic.mapper';
import { MovementMapper } from '@shared/mappers/movement.mapper';
import { CommunicationResponseDto } from '@shared/models/dto/response/communication.response.dto';
import { CommunicationModel } from '@shared/models/model/communication.model';

/**
 * Objectif: Convertit une réponse Communication du backend en modèle Communication.
 * Périmètre: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limites: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const CommunicationMapper = {
	toModel(dto: CommunicationResponseDto): CommunicationModel {
		return {
			...GenericMapper.toModel(dto),
			dateTime: dto.dateTime,
			message: dto.message,
			movement: dto.movement ? MovementMapper.toModel(dto.movement) : undefined,
			alert: dto.alert ? AlertMapper.toModel(dto.alert) : undefined,
		};
	},
} as const;
