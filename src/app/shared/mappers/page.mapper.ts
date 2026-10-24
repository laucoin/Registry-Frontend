import { PageResponseDto } from '@shared/models/dto/response/page.response.dto'
import { GenericModel } from '@shared/models/model/generic.model'
import { PageModel } from '@shared/models/model/page.model'

/**
 * Purpose: Convertit une réponse de page du backend en modèle de page.
 * Scope: Copie les champs de pagination et convertit chaque élément avec le mapper d'élément donné.
 * Limits: Ne connaît pas le type d'élément ; l'appelant fournit son mapper.
 */
export class PageMapper {
    public static toModel<D, M extends GenericModel> (dto: PageResponseDto<D>, mapContent: (element: D) => M): PageModel<M> {
        return {
            page: dto.page,
            size: dto.size,
            totalElements: dto.totalElements,
            totalPages: dto.totalPages,
            hasNext: dto.hasNext,
            content: dto.content.map( mapContent ),
            lastRefresh: dto.lastRefresh,
        }
    }
}
