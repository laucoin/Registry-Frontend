import { HistoryUserResponseDto } from '@shared/models/dto/response/history-user.response.dto';
import { HistoryUserModel } from '@shared/models/model/history-user.model';

/**
 * Objectif: Convertit une réponse HistoryUser du backend en modèle HistoryUser.
 * Périmètre: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limites: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const HistoryUserMapper = {
	toModel(dto: HistoryUserResponseDto): HistoryUserModel {
		return {
			id: dto.id,
			firstName: dto.firstName,
			lastName: dto.lastName,
			email: dto.email,
		};
	},
} as const;
