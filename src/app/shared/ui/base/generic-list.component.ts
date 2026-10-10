import { PageEventModel } from '@shared/models/model/page-event.model'
import { GenericComponent } from '@shared/ui/base/generic.component'

/**
 * Purpose: Base class of the paged lists.
 * Scope: Handles lazy page loading, search parameters and reload events.
 * Limits: Abstract; each list defines its search model and its facade calls.
 */
export abstract class GenericListComponent extends GenericComponent {
    protected abstract loadPage (pageEvent: PageEventModel): void
}
