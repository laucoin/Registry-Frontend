import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Signal, TemplateRef, viewChild } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/avatar'
import '@sgdf/ui/button'
import '@sgdf/ui/icon'
import '@sgdf/ui/list-item'
import '@sgdf/ui/tag'
import { ActivityActions } from '@pages/projects/[projectId]/configuration/activities/activity-row/activity-actions.service'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'
import { ActivityModel } from '@shared/models/model/activity.model'
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component'
import { EllipsisDirective } from '@shared/directives/ellipsis.directive'

const INITIALS_LENGTH: number = 2

type TagVariant = 'success' | 'info'

/**
 * Purpose: Row template of a activity in a list.
 * Scope: Holds the `sgdf-list-item` of a activity (name, details, availability dates, status and action menu) and exposes it as a template the list pages render inside their own list.
 * Limits: Renders nothing by itself; the page decides where the template is used. Commands are delegated to ActivityActions.
 */
@Component({
    selector: 'app-activity-row',
    imports: [EllipsisDirective, TranslocoPipe, CustomDateFormatPipe, ElementActionsComponent],
    providers: [ActivityActions],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    host: { class: 'contents' },
    templateUrl: './activity-row.component.html',
})
export class ActivityRowComponent {
    protected readonly actions: ActivityActions = inject(ActivityActions)

    public readonly template: Signal<TemplateRef<unknown>> = viewChild.required<TemplateRef<unknown>>('row')

    protected title(activity: ActivityModel): string {
        return activity.name
    }

    protected initials(activity: ActivityModel): string {
        return this.title(activity).trim().slice(0, INITIALS_LENGTH).toUpperCase()
    }

    protected statusVariant(activity: ActivityModel): TagVariant {
        return activity.status?.value === AvailabilityStatusEnum.AVAILABLE ? 'success' : 'info'
    }

    protected participantsRange(activity: ActivityModel): string | undefined {
        const range: ActivityModel['allowedParticipants'] = activity.allowedParticipants
        return range ? `${range.lower}-${range.upper}` : undefined
    }
}
