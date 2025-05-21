import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, Signal } from '@angular/core'
import { ElementCardComponent } from '../../../../../shared/util-ui/element-card/element-card.component'
import { TagModule } from 'primeng/tag'
import { TranslateModule } from '@ngx-translate/core'
import { ChipModule } from 'primeng/chip'
import { AppRouteEnum } from '../../../../../app-route.enum'
import { VehicleModel } from '../../../../../shared/util-model/model/vehicle.model'
import { VehicleFacade } from '../data/state/vehicle.facade'
import { SeverityTagComponent } from '../../../../../shared/util-ui/severity-tag/severity-tag.component'
import { GenericElementComponent } from '../../../../../shared/util-tool/component/generic-element.component'
import { CustomDateFormatPipe } from '../../../../../shared/util-tool/pipe/custom-date-format.pipe'
import { SeverityCircleComponent } from '../../../../../shared/util-ui/severity-circle/severity-circle.component'
import { SeverityEnum } from '../../../../../shared/util-model/enumeration/severity.enum'
import { PresenceStatusEnum } from '../../../../../shared/util-model/enumeration/presence-status.enum'
import { ProjectAuthorityEnum } from '../../../../../shared/util-model/enumeration/project-authority.enum'
import { ElementActionEnum } from '../../../../../shared/util-model/enumeration/element-action.enum'
import { ProjectOptionIconPipe } from '../../../../../shared/util-tool/pipe/project-option-icon.pipe'
import { MenuItem } from 'primeng/api'

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
        SeverityCircleComponent,
        ProjectOptionIconPipe,
    ],
    templateUrl: './vehicle-element.component.html',
    styleUrl: './vehicle-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class VehicleElementComponent extends GenericElementComponent {
    protected readonly facade: VehicleFacade = inject( VehicleFacade )

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly vehicle: InputSignal<VehicleModel> = input.required()

    protected readonly actions: Signal<MenuItem[]> = computed( (): MenuItem[] => [
        {
            label: 'vehicles.actions.movements-history',
            icon: 'pi pi-history',
            disabled: !this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_HISTORY_R ),
            visible: this.actionIsEnable( ElementActionEnum.VEHICLE_CONSULT_MOVEMENTS ),
            command: (): void => {
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_CONFIGURATION_VEHICLES_MOVEMENTS.replace( ':vehicleId', this.vehicle().id ),
                ).catch( console.error )
            },
        },
        {
            label: 'vehicles.actions.edit',
            icon: 'pi pi-pen-to-square',
            disabled: !this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_U ),
            visible: this.actionIsEnable( ElementActionEnum.VEHICLE_UPDATE ),
            command: (): void => {
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_CONFIGURATION_VEHICLES_EDITION.replace( ':vehicleId', this.vehicle().id ),
                ).catch( console.error )
            },
        },
        {
            label: 'vehicles.actions.disable',
            icon: 'pi pi-eye-slash',
            disabled: !this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_U ),
            visible: this.actionIsEnable( ElementActionEnum.VEHICLE_DISABLE ) && this.vehicle().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'vehicles.actions.confirmations.disable',
                        'pi pi-exclamation-triangle',
                        this.vehicle(),
                        SeverityEnum.WARNING,
                        (): void => this.facade.disableVehicle( this.vehicle().id ),
                    ),
                )
            },
        },
        {
            label: 'vehicles.actions.enable',
            icon: 'pi pi-replay',
            disabled: !this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_U ),
            visible: this.actionIsEnable( ElementActionEnum.VEHICLE_ENABLE ) && !this.vehicle().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'vehicles.actions.confirmations.enable',
                        'pi pi-info-circle',
                        this.vehicle(),
                        SeverityEnum.INFO,
                        (): void => this.facade.enableVehicle( this.vehicle().id ),
                    ),
                )
            },
        },
        {
            label: 'vehicles.actions.delete',
            icon: 'pi pi-trash',
            disabled: !this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_D ),
            visible: this.actionIsEnable( ElementActionEnum.VEHICLE_DELETE ),
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'vehicles.actions.confirmations.delete',
                        'pi pi-exclamation-triangle',
                        this.vehicle(),
                        SeverityEnum.DANGER,
                        (): void => this.facade.deleteVehicle( this.vehicle() ),
                    ),
                )
            },
        },
    ] )

    protected readonly vehicleStatusSeverity: Signal<SeverityEnum> = computed( (): SeverityEnum => {
        switch (this.vehicle().status.value) {
            case PresenceStatusEnum.IN:
                return SeverityEnum.SUCCESS
            case PresenceStatusEnum.OUT:
                return SeverityEnum.WARNING
            default:
                return SeverityEnum.SECONDARY
        }
    } )
}
