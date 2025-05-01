import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { PageEventModel } from '../../../../../shared/util-model/model/page-event.model'
import { ListComponent } from '../../../../../shared/util-ui/list/list.component'
import { RegistryTemplateDirective } from '../../../../../shared/util-tool/directive/registry-template.directive'
import { TranslateModule } from '@ngx-translate/core'
import { InputTextModule } from 'primeng/inputtext'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { DropdownModule } from 'primeng/dropdown'
import { MovementElementComponent } from '../../../../../shared/util-ui/movement-element/movement-element.component'
import { Select } from 'primeng/select'
import { Button } from 'primeng/button'
import { DatePicker } from 'primeng/datepicker'
import { VehicleFacade } from '../data/state/vehicle.facade'
import { VehicleElementComponent } from '../vehicle-element/vehicle-element.component'
import { GenericListComponent } from '../../../../../shared/util-tool/component/generic-list.component'
import { MovementFacade } from '../../../movement/data/state/movement.facade'
import { Subscription, tap } from 'rxjs'
import { ElementSkeletonComponent } from '../../../../../shared/util-ui/element-skeleton/element-skeleton.component'
import { Card } from 'primeng/card'

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
        DropdownModule,
        MovementElementComponent,
        Select,
        Button,
        DatePicker,
        VehicleElementComponent,
        ElementSkeletonComponent,
        Card,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class VehicleMovementsListComponent extends GenericListComponent implements OnDestroy {
    protected readonly facade: VehicleFacade = inject( VehicleFacade )
    protected readonly movementFacade: MovementFacade = inject( MovementFacade )

    private readonly subscriptions: Subscription = new Subscription()

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()
        this.handleMovementActions()
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            typeSearched: this.formBuilder.control( this.facade.vehicleMovementsPageTypeSearchedParam() ),
            startDateTimeSearched: this.formBuilder.control( this.facade.vehicleMovementsPageStartDateTimeSearchedParam() ),
            endDateTimeSearched: this.formBuilder.control( this.facade.vehicleMovementsPageEndDateTimeSearchedParam() ),
            visibilitySearched: this.formBuilder.control( this.facade.vehicleMovementsPageVisibilitySearchedParam() ),
        } )
    }

    protected loadData (): void {
        const id: string | undefined = this.route.snapshot.params['vehicleId']
        this.facade.fetchVehicle( id! )
        this.facade.fetchVehicleMovementsPage( id!, undefined, undefined, false )
    }

    private handleMovementActions (): void {
        this.subscriptions.add(
            this.movementFacade.handleMovementFirstPageReload().pipe(
                tap( (): void => {
                    this.facade.fetchVehicleMovementsPage(
                        this.route.snapshot.params['vehicleId'],
                        undefined,
                        undefined,
                        true,
                    )
                } ),
            ).subscribe(),
        )

        this.subscriptions.add(
            this.movementFacade.handleMovementCurrentPageReload().pipe(
                tap( (): void => {
                    this.facade.fetchVehicleMovementsPage(
                        this.route.snapshot.params['vehicleId'],
                        this.facade.vehicleMovementsPage()?.pageNumber,
                        this.facade.vehicleMovementsPage()?.pageSize,
                        true,
                    )
                } ),
            ).subscribe(),
        )
    }

    protected loadPage (pageEvent: PageEventModel): void {
        this.facade.inputMovementsPageSearchParameters(
            this.typeSearched.value,
            this.startDateTimeSearched.value,
            this.endDateTimeSearched.value,
            this.visibilitySearched.value,
        )
        this.facade.fetchVehicleMovementsPage(
            this.facade.vehicle()!.id, pageEvent.pageNumber, pageEvent.pageSize, false,
        )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected get typeSearched (): FormControl {
        return this.form.get( 'typeSearched' ) as FormControl
    }

    protected get startDateTimeSearched (): FormControl {
        return this.form.get( 'startDateTimeSearched' ) as FormControl
    }

    protected get endDateTimeSearched (): FormControl {
        return this.form.get( 'endDateTimeSearched' ) as FormControl
    }

    protected get visibilitySearched (): FormControl {
        return this.form.get( 'visibilitySearched' ) as FormControl
    }
}
