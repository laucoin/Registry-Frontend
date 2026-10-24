import { PairResponseDto } from '@shared/models/dto/response/pair.response.dto'
import { PairModel } from '@shared/models/model/pair.model'

/**
 * Purpose: Convertit une réponse de paire du backend en modèle de paire.
 * Scope: Copie la clé et convertit la valeur avec le mapper donné.
 * Limits: Ne connaît pas le type de valeur ; l'appelant fournit son mapper.
 */
export class PairMapper {
    public static toModel<D, M> (dto: PairResponseDto<D>, mapSecond: (second: D) => M): PairModel<M> {
        return { first: dto.first, second: mapSecond( dto.second ) }
    }
}
