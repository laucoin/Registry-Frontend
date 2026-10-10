import { PairResponseDto } from '@shared/models/dto/response/pair.response.dto'
import { PairModel } from '@shared/models/model/pair.model'

/**
 * Purpose: Converts a pair response of the backend into a pair model.
 * Scope: Copies the key and converts the value with the given mapper.
 * Limits: Does not know the value type; the caller provides its mapper.
 */
export class PairMapper {
    public static toModel<D, M> (dto: PairResponseDto<D>, mapSecond: (second: D) => M): PairModel<M> {
        return { first: dto.first, second: mapSecond( dto.second ) }
    }
}
