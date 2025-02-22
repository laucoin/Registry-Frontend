import { Component, OnInit, signal, WritableSignal } from '@angular/core'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'
import { MovementModel } from '../../../shared/util-model/movement.model'
import { OrderEnum } from '../../../shared/util-model/enumeration/order.enum'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { TranslateModule } from '@ngx-translate/core'
import { InputTextModule } from 'primeng/inputtext'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { AsyncPipe } from '@angular/common'
import { MessageComponent } from '../../../shared/util-ui/message/message.component'
import { DropdownModule } from 'primeng/dropdown'
import { MovementElementComponent } from '../../../shared/util-ui/movement-element/movement-element.component'
import { Params } from '@angular/router'
import { Select } from 'primeng/select'
import { Button } from 'primeng/button'
import { DatePicker } from 'primeng/datepicker'
import { Observable } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { VehicleFacade } from '../data/state/vehicle.facade'
import { StringUtils } from '../../../shared/util-tool/util/string.util'
import { AppRouteEnum } from '../../../app-route.enum'
import { GenericUtil } from '../../../shared/util-tool/util/generic.util'
import { VehicleModel } from '../../../shared/util-model/model/vehicle.model'
import { VehicleElementComponent } from '../vehicle-element/vehicle-element.component'

@Component( {
    selector: 'app-vehicle-movements-list',
    standalone: true,
    templateUrl: './vehicle-movements-list.component.html',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        ReactiveFormsModule,
        TranslateModule,
        InputTextModule,
        ToggleButtonModule,
        AsyncPipe,
        MessageComponent,
        DropdownModule,
        MovementElementComponent,
        Select,
        Button,
        DatePicker,
        VehicleElementComponent,

    ],
} )
export class VehicleMovementsListComponent extends GenericListComponent<MovementModel> implements OnInit {
    protected readonly vehicle: WritableSignal<VehicleModel | undefined> = signal( undefined )
    protected readonly movementTypes$: Observable<SelectItem<string>[]>

    public constructor (private readonly facade: VehicleFacade) {
        super(
            facade.vehicleMovementsPage,
            facade.vehicleMovementsPageLoading,
            facade.vehicleMovementsPageSilentLoading,
            facade.vehicleMovementsPageError,
        )

        this.form = this.initForm()
        this.movementTypes$ = facade.movementTypesMetadata

        this.handleSearchedChanges()
        this.handleTypeChanges()
        this.handleRangeChanges()
        this.handleOnlyVisibleChanges()
        this.handleOrderChanges()
    }

    public ngOnInit (): void {
        this.facade.fetchVehicleMovementTypes()
        this.handleIdParam()

        this.handleLoadedVehicle()
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            searched: this.formBuilder.control( this.facade.actualVehicleMovementsPageSearchParam ),
            type: this.formBuilder.control( this.facade.actualVehicleMovementsPageMovementTypeParam ),
            range: this.formBuilder.control( this.facade.actualVehicleMovementsPageDateRangeParam ),
            onlyVisible: this.formBuilder.control( this.facade.actualVehicleMovementsPageOnlyVisibleParam ),
            order: this.formBuilder.control( this.facade.actualVehicleMovementsPageOrderParam === OrderEnum.DESC ),
        } )
    }

    private handleIdParam (): void {
        if (!StringUtils.isRouteActive( AppRouteEnum.VEHICLES )) {
            return
        }
        this.subscriptions.add(
            this.route.params.subscribe( (params: Params): void => {
                if (GenericUtil.isNull( params['id'] )) {
                    this.router.navigateByUrl( AppRouteEnum.VEHICLES ).catch( console.error )
                }
                this.facade.fetchVehicle( params['id'], this.contextEventId() )
                this.facade.fetchVehicleMovementsPage(
                    params['id'],
                    undefined,
                    undefined,
                    false,
                    this.contextEventId(),
                )
            } ),
        )
    }

    private handleLoadedVehicle (): void {
        this.subscriptions.add(
            this.facade.vehicle?.subscribe( (group: VehicleModel | undefined): void => this.vehicle.set(
                group ) ),
        )
    }

    protected loadPage (pageEvent: PageEventModel, eventId: string | undefined): void {
        this.facade.fetchVehicleMovementsPage(
            this.vehicle()!.id, pageEvent.offset, pageEvent.limit, false, eventId,
        )
    }

    private handleSearchedChanges (): void {
        this.subscriptions.add(
            this.searched.valueChanges.subscribe( (searched: string | undefined): void =>
                this.facade.inputVehicleMovementsPageSearch( searched ),
            ),
        )
    }

    private handleTypeChanges (): void {
        this.subscriptions.add(
            this.type.valueChanges.subscribe( (type: string | undefined): void =>
                this.facade.selectVehicleMovementsPageType( type ),
            ),
        )
    }

    private handleRangeChanges (): void {
        this.subscriptions.add(
            this.range.valueChanges.subscribe( (range: Date[] | undefined): void =>
                this.facade.inputVehicleMovementsPageDateRange( range ),
            ),
        )
    }

    private handleOnlyVisibleChanges (): void {
        this.subscriptions.add(
            this.onlyVisible.valueChanges.subscribe( (onlyVisible: boolean | undefined): void => {
                if (onlyVisible != undefined) {
                    this.facade.selectVehicleMovementsPageVisibility( onlyVisible )
                }
            } ),
        )
    }

    private handleOrderChanges (): void {
        this.subscriptions.add(
            this.order.valueChanges.subscribe( (order: boolean | undefined): void => {
                if (order != undefined) {
                    this.facade.selectVehicleMovementsPageOrder( order ? OrderEnum.DESC : OrderEnum.ASC )
                }
            } ),
        )
    }

    protected get searched (): FormControl {
        return this.form.get( 'searched' ) as FormControl
    }

    protected get type (): FormControl {
        return this.form.get( 'type' ) as FormControl
    }

    protected get range (): FormControl {
        return this.form.get( 'range' ) as FormControl
    }

    protected get onlyVisible (): FormControl {
        return this.form.get( 'onlyVisible' ) as FormControl
    }

    protected get order (): FormControl {
        return this.form.get( 'order' ) as FormControl
    }
}
