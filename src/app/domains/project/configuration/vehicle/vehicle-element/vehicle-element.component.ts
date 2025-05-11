import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, signal, Signal } from '@angular/core'
import { ElementCardComponent } from '../../../../../shared/util-ui/element-card/element-card.component'
import { TagModule } from 'primeng/tag'
import { TranslateModule } from '@ngx-translate/core'
import { AppConfig } from '../../../../../app.config'
import { ChipModule } from 'primeng/chip'
import { ActionModel } from '../../../../../shared/util-model/model/action.model'
import { AppRouteEnum } from '../../../../../app-route.enum'
import { VehicleModel } from '../../../../../shared/util-model/model/vehicle.model'
import { VehicleFacade } from '../data/state/vehicle.facade'
import { SeverityTagComponent } from '../../../../../shared/util-ui/severity-tag/severity-tag.component'
import { GenericElementComponent } from '../../../../../shared/util-tool/component/generic-element.component'
import { CustomDateFormatPipe } from '../../../../../shared/util-tool/pipe/custom-date-format.pipe'
import {
    ConfirmationDialogComponent,
} from '../../../../../shared/util-ui/confirmation-dialog/confirmation-dialog.component'
import { SeverityCircleComponent } from '../../../../../shared/util-ui/severity-circle/severity-circle.component'
import { SeverityEnum } from '../../../../../shared/util-model/enumeration/severity.enum'
import { PresenceStatusEnum } from '../../../../../shared/util-model/enumeration/presence-status.enum'
import { ProjectAuthorityEnum } from '../../../../../shared/util-model/enumeration/project-authority.enum'
import { ElementActionEnum } from '../../../../../shared/util-model/enumeration/element-action.enum'
import { ProjectOptionEnum } from '../../../../../shared/util-model/enumeration/project-option.enum'
import { ProjectOptionIconPipe } from '../../../../../shared/util-tool/pipe/project-option-icon.pipe'

@Component( {
    selector: 'app-vehicle-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        TagModule,
        TranslateModule,
        ChipModule,
        SeverityTagComponent,
        CustomDateFormatPipe,
        ConfirmationDialogComponent,
        SeverityCircleComponent,
        ProjectOptionIconPipe,
    ],
    templateUrl: './vehicle-element.component.html',
    styleUrl: './vehicle-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class VehicleElementComponent extends GenericElementComponent<VehicleModel> {
    protected readonly facade: VehicleFacade = inject( VehicleFacade )

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly vehicle: InputSignal<VehicleModel> = input.required()

    private readonly allActions: Signal<ActionModel[]> = signal( [
        {
            id: ElementActionEnum.VEHICLE_CONSULT_MOVEMENTS,
            label: 'vehicles.actions.movements-history',
            icon: 'pi pi-history',
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_HISTORY_R,
            requiredProjectOption: ProjectOptionEnum.VEHICLE,
        },
        {
            id: ElementActionEnum.VEHICLE_UPDATE,
            label: 'vehicles.actions.edit',
            icon: 'pi pi-pen-to-square',
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_U,
            requiredProjectOption: ProjectOptionEnum.VEHICLE,
        },
        {
            id: ElementActionEnum.VEHICLE_DISABLE,
            label: 'vehicles.actions.disable',
            icon: 'pi pi-eye-slash',
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_U,
            requiredProjectOption: ProjectOptionEnum.VEHICLE,
            confirmation: {
                header: 'vehicles.actions.confirmations.disable.title',
                message: 'vehicles.actions.confirmations.disable.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.WARNING,
                rejectSeverity: SeverityEnum.SECONDARY,
            },
        },
        {
            id: ElementActionEnum.VEHICLE_ENABLE,
            label: 'vehicles.actions.enable',
            icon: 'pi pi-replay',
            disabled: true,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_U,
            requiredProjectOption: ProjectOptionEnum.VEHICLE,
            confirmation: {
                header: 'vehicles.actions.confirmations.enable.title',
                message: 'vehicles.actions.confirmations.enable.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.WARNING,
                rejectSeverity: SeverityEnum.SECONDARY,
            },
        },
        {
            id: ElementActionEnum.VEHICLE_DELETE,
            label: 'vehicles.actions.delete',
            icon: 'pi pi-trash',
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_D,
            requiredProjectOption: ProjectOptionEnum.VEHICLE,
            confirmation: {
                header: 'vehicles.actions.confirmations.delete.title',
                message: 'vehicles.actions.confirmations.delete.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.DANGER,
                rejectSeverity: SeverityEnum.SECONDARY,
                confirmProperty: 'licensePlate',
            },
        },
    ] )
    protected readonly vehicleStatusSeverity: Signal<SeverityEnum>
    protected readonly actions: Signal<ActionModel[]>

    public constructor () {
        super()

        this.vehicleStatusSeverity = computed( (): SeverityEnum => {
            switch (this.vehicle().status.value) {
                case PresenceStatusEnum.IN:
                    return SeverityEnum.SUCCESS
                case PresenceStatusEnum.OUT:
                    return SeverityEnum.WARNING
                default:
                    return SeverityEnum.SECONDARY
            }
        } )

        this.actions = computed( (): ActionModel[] => this.buildActions(
            this.vehicle(),
            this.allActions(),
        ) )
    }

    protected isActionVisible (element: VehicleModel, action: ActionModel): boolean {
        if (!AppConfig.config.vehicle.actions.includes( action.id )) return false

        switch (action.id) {
            case ElementActionEnum.VEHICLE_DISABLE:
                return element.visible
            case ElementActionEnum.VEHICLE_ENABLE:
                return !element.visible
            default:
                return true
        }
    }

    protected handleAction (action: ElementActionEnum): void {
        switch (action) {
            case ElementActionEnum.VEHICLE_CONSULT_MOVEMENTS:
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_CONFIGURATION_VEHICLES_MOVEMENTS.replace( ':vehicleId', this.vehicle().id ),
                ).catch( console.error )
                break
            case ElementActionEnum.VEHICLE_UPDATE:
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_CONFIGURATION_VEHICLES_EDITION.replace( ':vehicleId', this.vehicle().id ),
                ).catch( console.error )
                break
            case ElementActionEnum.VEHICLE_DISABLE:
                this.facade.disableVehicle( this.vehicle().id )
                break
            case ElementActionEnum.VEHICLE_ENABLE:
                this.facade.enableVehicle( this.vehicle().id )
                break
            case ElementActionEnum.VEHICLE_DELETE:
                this.facade.deleteVehicle( this.vehicle() )
                break
            default:
                console.warn( this.translateService.instant( 'global.messages.invalid-action' ) )
        }
    }
}
