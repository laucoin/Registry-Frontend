import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Signal, TemplateRef, viewChild } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/avatar'
import '@sgdf/ui/button'
import '@sgdf/ui/icon'
import '@sgdf/ui/list-item'
import '@sgdf/ui/tag'
import { GroupActions } from '@pages/projects/[projectId]/configuration/groups/group-row/group-actions.service'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'
import { GroupModel } from '@shared/models/model/group.model'
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component'
import { EllipsisDirective } from '@shared/directives/ellipsis.directive'

const INITIALS_LENGTH: number = 2

/**
 * Purpose: Row template of a group in a list.
 * Scope: Holds the `sgdf-list-item` of a group (name, members, availability dates, status and action menu) and exposes it as a template the list pages render inside their own list.
 * Limits: Renders nothing by itself; the page decides where the template is used. Commands are delegated to GroupActions.
 */
@Component({
    selector: 'app-group-row',
    imports: [EllipsisDirective, TranslocoPipe, CustomDateFormatPipe, PluralTranslationPipe, ElementActionsComponent],
    providers: [GroupActions],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    host: { class: 'contents' },
    templateUrl: './group-row.component.html',
})
export class GroupRowComponent {
    protected readonly actions: GroupActions = inject(GroupActions)

    public readonly template: Signal<TemplateRef<unknown>> = viewChild.required<TemplateRef<unknown>>('row')

    protected initials(group: GroupModel): string {
        return group.name.trim().slice(0, INITIALS_LENGTH).toUpperCase()
    }

    protected statusVariant(group: GroupModel): 'success' | 'info' {
        return group.status?.value === AvailabilityStatusEnum.AVAILABLE ? 'success' : 'info'
    }
}
