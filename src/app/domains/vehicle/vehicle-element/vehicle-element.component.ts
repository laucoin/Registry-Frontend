import { Component, Input, OnChanges } from '@angular/core'
import { DatePipe } from '@angular/common'
import { ElementCardComponent } from '../../../shared/util-ui/element-card/element-card.component'
import { TagModule } from 'primeng/tag'
import { TranslateModule } from '@ngx-translate/core'
import { GenericElementComponent } from '../../../shared/util-tool/component/generic-element.component'
import { AppConfig } from '../../../app.config'
import { ChipModule } from 'primeng/chip'
import { ActionModel } from '../../../shared/util-model/model/action.model'
import { CurrentUserUtil } from '../../../shared/util-authentication/tool/current-user.util'
import { CurrentUserModel } from '../../../shared/util-model/model/current-user.model'
import { AppRouteEnum } from '../../../app-route.enum'
import { VehicleActionEnum } from '../data/state/vehicle.action'
import { VehicleModel } from '../../../shared/util-model/model/vehicle.model'
import { VehicleFacade } from '../data/state/vehicle.facade'
import { GroupActionEnum } from '../../group/data/state/group.action'
import { DateIsPastPipe } from '../../../shared/util-tool/pipe/date-is-past.pipe'

@Component( {
    selector: 'app-vehicle-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        TagModule,
        TranslateModule,
        DatePipe,
        ChipModule,
        DateIsPastPipe,

    ],
    templateUrl: './vehicle-element.component.html',
    styleUrl: './vehicle-element.component.scss',
} )
export class VehicleElementComponent extends GenericElementComponent<VehicleModel, VehicleActionEnum> implements OnChanges {
    @Input() public showActionMenu: boolean = true

    public constructor (private readonly facade: VehicleFacade) {super()}

    public ngOnChanges (): void {
        this.defineActions()
    }

    private defineActions (): void {
        const currentUser: CurrentUserModel = this.registryFacade.actualCurrentUser!
        this.actions = AppConfig
            .config.vehicle.action
            .map( (action: ActionModel<VehicleActionEnum>): ActionModel<VehicleActionEnum> => ({
                    ...action,
                    disabled: this.isActionDisabled( currentUser, action ),
                }),
            )
            .filter( (action: ActionModel<VehicleActionEnum>): boolean => !action.disabled )
    }

    protected override isActionDisabled (
        currentUser: CurrentUserModel,
        action: ActionModel<VehicleActionEnum | GroupActionEnum>,
    ): boolean {
        const isActionFeasible: boolean = CurrentUserUtil.isFeasible(
            currentUser,
            this.element.event,
            action,
        )

        switch (action.id) {
            case VehicleActionEnum.DISABLE_VEHICLE:
                return !(isActionFeasible && this.element.visible)
            case VehicleActionEnum.ENABLE_VEHICLE:
                return !(isActionFeasible && !this.element.visible)
            default:
                return !isActionFeasible
        }
    }

    protected handleAction (action: VehicleActionEnum): void {
        switch (action) {
            case VehicleActionEnum.FETCH_VEHICLE_MOVEMENTS_PAGE:
                this.router.navigateByUrl(
                    this.buildUri( AppRouteEnum.VEHICLES_MOVEMENTS.replace( ':id', this.element.id ) ),
                ).catch( console.error )
                break
            case VehicleActionEnum.UPDATE_VEHICLE:
                this.router.navigateByUrl(
                    this.buildUri( AppRouteEnum.VEHICLES_EDITION.replace( ':id', this.element.id ) ),
                ).catch( console.error )
                break
            case VehicleActionEnum.DISABLE_VEHICLE:
                this.facade.disableVehicle( this.element.id, this.contextEventId() )
                break
            case VehicleActionEnum.ENABLE_VEHICLE:
                this.facade.enableVehicle( this.element.id, this.contextEventId() )
                break
            case VehicleActionEnum.DELETE_VEHICLE:
                this.facade.deleteVehicle( this.element, this.contextEventId() )
                break
            default:
                console.warn( this.translateService.instant( 'warning.message.invalid-action' ) )
        }
    }
}
