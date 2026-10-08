import { PageResponseDto } from '@shared/models/dto/response/page.response.dto'
import { GenericModel } from '@shared/models/model/generic.model'
import { PageModel } from '@shared/models/model/page.model'

/**
 * Purpose: Converts a page response of the backend into a page model.
 * Scope: Copies the paging fields and converts each element with the given element mapper.
 * Limits: Does not know the element type; the caller provides its mapper.
 */
export class PageMapper {
    public static toModel<D, M extends GenericModel> (dto: PageResponseDto<D>, mapContent: (element: D) => M): PageModel<M> {
        return {
            pageNumber: dto.pageNumber,
            pageSize: dto.pageSize,
            totalElements: dto.totalElements,
            totalPages: dto.totalPages,
            content: dto.content.map( mapContent ),
            lastRefresh: dto.lastRefresh,
        }
    }
}
