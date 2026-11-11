import { CommunicationMapper } from '@shared/mappers/communication.mapper';
import { GenericMapper } from '@shared/mappers/generic.mapper';
import { AlertResponseDto } from '@shared/models/dto/response/alert.response.dto';
import { AlertModel } from '@shared/models/model/alert.model';

/**
 * Objectif: Convertit une réponse Alert du backend en modèle Alert.
 * Périmètre: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limites: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const AlertMapper = {
	toModel(dto: AlertResponseDto): AlertModel {
		return {
			...GenericMapper.toModel(dto),
			dateTime: dto.dateTime,
			title: dto.title,
			status: dto.status,
			criticality: dto.criticality,
			lastCommunication: dto.lastCommunication
				? { dateTime: dto.lastCommunication.dateTime, message: dto.lastCommunication.message }
				: undefined,
			communications: dto.communications?.map(CommunicationMapper.toModel),
		};
	},
} as const;
