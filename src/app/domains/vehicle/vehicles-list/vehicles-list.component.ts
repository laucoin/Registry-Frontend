import { Component, OnInit } from '@angular/core'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'
import { VehicleModel } from '../../../shared/util-model/model/vehicle.model'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { VehicleFacade } from '../data/state/vehicle.facade'
import { OrderEnum } from '../../../shared/util-model/enumeration/order.enum'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { TranslateModule } from '@ngx-translate/core'
import { InputTextModule } from 'primeng/inputtext'
import { DropdownModule } from 'primeng/dropdown'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { AsyncPipe } from '@angular/common'
import { MessageComponent } from '../../../shared/util-ui/message/message.component'
import { RouterLink } from '@angular/router'
import { VehicleRoutesEnum } from '../vehicle-routes.enum'
import { Button } from 'primeng/button'
import { DatePicker } from 'primeng/datepicker'
import { VehicleElementComponent } from '../vehicle-element/vehicle-element.component'

@Component( {
    selector: 'app-vehicles-list',
    standalone: true,
    templateUrl: './vehicles-list.component.html',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        ReactiveFormsModule,
        TranslateModule,
        InputTextModule,
        DropdownModule,
        ToggleButtonModule,
        AsyncPipe,
        MessageComponent,
        RouterLink,
        Button,
        DatePicker,
        VehicleElementComponent,
    ],
} )
export class VehiclesListComponent extends GenericListComponent<VehicleModel> implements OnInit {
    protected readonly VehicleRoutesEnum: typeof VehicleRoutesEnum = VehicleRoutesEnum

    public constructor (private readonly facade: VehicleFacade) {
        super(
            facade.vehiclesPage,
            facade.vehiclesPageLoading,
            facade.vehiclesPageSilentLoading,
            facade.vehiclesPageError,
        )

        this.form = this.initForm()

        this.handleSearchedChanges()
        this.handleRangeChanges()
        this.handleOnlyVisibleChanges()
        this.handleOrderChanges()
    }

    public ngOnInit (): void {
        this.facade.fetchVehiclesPage( undefined, undefined, false, this.contextEventId() )
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            searched: this.formBuilder.control( this.facade.actualVehiclesPageSearchParam ),
            range: this.formBuilder.control( this.facade.actualVehiclesPageDateRangeParam ),
            onlyVisible: this.formBuilder.control( this.facade.actualVehiclesPageOnlyVisibleParam ),
            order: this.formBuilder.control( this.facade.actualVehiclesPageOrderParam === OrderEnum.ASC ),
        } )
    }

    protected loadPage (pageEvent: PageEventModel, eventId: string | undefined): void {
        this.facade.fetchVehiclesPage( pageEvent.offset, pageEvent.limit, false, eventId )
    }

    private handleSearchedChanges (): void {
        this.subscriptions.add(
            this.searched.valueChanges.subscribe( (searched: string | undefined): void =>
                this.facade.inputVehiclesPageSearch( searched ),
            ),
        )
    }

    private handleRangeChanges (): void {
        this.subscriptions.add(
            this.range.valueChanges.subscribe( (range: Date[] | undefined): void =>
                this.facade.inputVehiclesPageDateRange( range ),
            ),
        )
    }

    private handleOnlyVisibleChanges (): void {
        this.subscriptions.add(
            this.onlyVisible.valueChanges.subscribe( (onlyVisible: boolean | undefined): void => {
                if (onlyVisible != undefined) {
                    this.facade.selectVehiclesPageVisibility( onlyVisible )
                }
            } ),
        )
    }

    private handleOrderChanges (): void {
        this.subscriptions.add(
            this.order.valueChanges.subscribe( (order: boolean | undefined): void => {
                if (order != undefined) {
                    this.facade.selectVehiclesPageOrder( order ? OrderEnum.ASC : OrderEnum.DESC )
                }
            } ),
        )
    }

    protected get searched (): FormControl {
        return this.form.get( 'searched' ) as FormControl
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
