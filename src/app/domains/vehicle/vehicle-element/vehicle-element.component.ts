import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    InputSignal,
    OnDestroy,
    Signal,
} from '@angular/core'
import { ElementCardComponent } from '../../../shared/util-ui/element-card/element-card.component'
import { TagModule } from 'primeng/tag'
import { TranslateModule } from '@ngx-translate/core'
import { AppConfig } from '../../../app.config'
import { ChipModule } from 'primeng/chip'
import { ActionModel } from '../../../shared/util-model/model/action.model'
import { AppRouteEnum } from '../../../app-route.enum'
import { VehicleActionEnum } from '../data/state/vehicle.action'
import { VehicleModel } from '../../../shared/util-model/model/vehicle.model'
import { VehicleFacade } from '../data/state/vehicle.facade'
import { SeverityTagComponent } from '../../../shared/util-ui/severity-tag/severity-tag.component'
import { DateIntervalStatusModel } from '../../../shared/util-model/model/date-interval-status.model'
import { DateUtil } from '../../../shared/util-tool/util/date.util'
import { GenericElementComponent } from '../../../shared/util-tool/component/generic-element.component'
import { IntervalFormatPipe } from '../../../shared/util-tool/pipe/interval-format.pipe'
import { VisibilityNamePipe } from '../../../shared/util-tool/pipe/visibility.pipe'
import { CustomDateFormatPipe } from '../../../shared/util-tool/pipe/custom-date-format.pipe'
import { ConfirmationDialogComponent } from '../../../shared/util-ui/confirmation-dialog/confirmation-dialog.component'
import { tap } from 'rxjs'

@Component( {
    selector: 'app-vehicle-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        TagModule,
        TranslateModule,
        ChipModule,
        SeverityTagComponent,
        IntervalFormatPipe,
        VisibilityNamePipe,
        CustomDateFormatPipe,
        ConfirmationDialogComponent,
    ],
    templateUrl: './vehicle-element.component.html',
    styleUrl: './vehicle-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class VehicleElementComponent extends GenericElementComponent<VehicleModel, VehicleActionEnum> implements OnDestroy {
    protected readonly facade: VehicleFacade = inject( VehicleFacade )

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly vehicle: InputSignal<VehicleModel> = input.required()

    protected readonly vehicleStatusSeverity: Signal<'success' | 'warn' | 'secondary'>
    protected readonly actions: Signal<ActionModel<VehicleActionEnum>[]>
    protected readonly intervalStatus: Signal<DateIntervalStatusModel>

    public constructor () {
        super()

        this.intervalStatus = computed( (): DateIntervalStatusModel => DateUtil.dateRangeStatus(
            this.vehicle().startAvailability,
            this.vehicle().endAvailability,
        ) )

        this.vehicleStatusSeverity = computed( (): 'success' | 'warn' | 'secondary' => {
            switch (this.vehicle().status.value) {
                case 'IN':
                    return 'success'
                case 'OUT':
                    return 'warn'
                default:
                    return 'secondary'
            }
        } )

        this.actions = computed( (): ActionModel<VehicleActionEnum>[] => this.buildActions(
            this.vehicle(),
            AppConfig.config.vehicle.action,
        ) )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected isActionVisible (element: VehicleModel, action: ActionModel<VehicleActionEnum>): boolean {
        switch (action.id) {
            case VehicleActionEnum.DISABLE_VEHICLE:
                return element.visible
            case VehicleActionEnum.ENABLE_VEHICLE:
                return !element.visible
            default:
                return true
        }
    }

    protected handleAction (action: VehicleActionEnum): void {
        switch (action) {
            case VehicleActionEnum.FETCH_VEHICLE_MOVEMENTS_PAGE:
                this.router.navigateByUrl(
                    AppRouteEnum.VEHICLES_MOVEMENTS.replace( ':vehicleId', this.vehicle().id ),
                ).catch( console.error )
                break
            case VehicleActionEnum.UPDATE_VEHICLE:
                this.router.navigateByUrl(
                    AppRouteEnum.VEHICLES_EDITION.replace( ':vehicleId', this.vehicle().id ),
                ).catch( console.error )
                break
            case VehicleActionEnum.DISABLE_VEHICLE:
                this.subscriptions.add(
                    this.facade.disableVehicle( this.vehicle().id ).pipe(
                        tap( (): void => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            case VehicleActionEnum.ENABLE_VEHICLE:
                this.subscriptions.add(
                    this.facade.enableVehicle( this.vehicle().id ).pipe(
                        tap( (): void => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            case VehicleActionEnum.DELETE_VEHICLE:
                this.subscriptions.add(
                    this.facade.deleteVehicle( this.vehicle() ).pipe(
                        tap( (): void => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            default:
                console.warn( this.translateService.instant( 'global.messages.invalid-action' ) )
        }
    }
}
