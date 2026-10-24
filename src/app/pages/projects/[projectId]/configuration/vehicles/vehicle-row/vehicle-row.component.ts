import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Signal, TemplateRef, viewChild } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/avatar'
import '@sgdf/ui/button'
import '@sgdf/ui/icon'
import '@sgdf/ui/list-item'
import '@sgdf/ui/tag'
import { VehicleActions } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-row/vehicle-actions.service'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { VehicleModel } from '@shared/models/model/vehicle.model'
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component'
import { EllipsisDirective } from '@shared/directives/ellipsis.directive'

const INITIALS_LENGTH: number = 2

type TagVariant = 'success' | 'warning' | 'neutral'

/**
 * Purpose: Row template of a vehicle in a list.
 * Scope: Holds the `sgdf-list-item` of a vehicle (name, details, availability dates, status and action menu) and exposes it as a template the list pages render inside their own list.
 * Limits: Renders nothing by itself; the page decides where the template is used. Commands are delegated to VehicleActions.
 */
@Component({
    selector: 'app-vehicle-row',
    imports: [EllipsisDirective, TranslocoPipe, CustomDateFormatPipe, ElementActionsComponent],
    providers: [VehicleActions],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    host: { class: 'contents' },
    templateUrl: './vehicle-row.component.html',
})
export class VehicleRowComponent {
    protected readonly actions: VehicleActions = inject(VehicleActions)

    public readonly template: Signal<TemplateRef<unknown>> = viewChild.required<TemplateRef<unknown>>('row')

    protected title(vehicle: VehicleModel): string {
        return vehicle.licensePlate
    }

    protected initials(vehicle: VehicleModel): string {
        return this.title(vehicle).trim().slice(0, INITIALS_LENGTH).toUpperCase()
    }

    protected statusVariant(vehicle: VehicleModel): TagVariant {
        switch (vehicle.status.value) {
            case PresenceStatusEnum.IN:
                return 'success'
            case PresenceStatusEnum.OUT:
                return 'warning'
            default:
                return 'neutral'
        }
    }
}
