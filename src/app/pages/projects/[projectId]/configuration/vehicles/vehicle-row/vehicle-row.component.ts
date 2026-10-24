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
 * Purpose: Template de ligne d'un véhicule dans une liste.
 * Scope: Contient le `sgdf-list-item` d'un véhicule (nom, détails, dates de disponibilité, statut et menu d'actions) et l'expose comme un template que les pages de liste affichent dans leur propre liste.
 * Limits: N'affiche rien par lui-même ; la page décide où le template est utilisé. Les commandes sont déléguées à VehicleActions.
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
