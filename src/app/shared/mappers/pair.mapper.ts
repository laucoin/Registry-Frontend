import { PairResponseDto } from '@shared/models/dto/response/pair.response.dto';
import { PairModel } from '@shared/models/model/pair.model';

/**
 * Objectif: Convertit une réponse de paire du backend en modèle de paire.
 * Périmètre: Copie la clé et convertit la valeur avec le mapper donné.
 * Limites: Ne connaît pas le type de valeur ; l'appelant fournit son mapper.
 */
export const PairMapper = {
	toModel<D, M>(dto: PairResponseDto<D>, mapSecond: (second: D) => M): PairModel<M> {
		return { first: dto.first, second: mapSecond(dto.second) };
	},
} as const;
