import { Component, inject, OnDestroy, signal, WritableSignal } from '@angular/core'
import {VehicleModel} from '@shared/models/model/vehicle.model'
import {withLoading} from '@shared/helpers/rx.helper'
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {ListComponent} from '@shared/ui/common/list/list.component'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {TranslatePipe} from '@ngx-translate/core'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {MovementElementComponent} from '@shared/ui/movement-element/movement-element.component'
import {Select, SelectModule} from 'primeng/select'
import {Button} from 'primeng/button'
import {DatePicker} from 'primeng/datepicker'
import {VehicleFacade} from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import {VehicleElementComponent} from '@pages/projects/[projectId]/configuration/vehicles/vehicle-element/vehicle-element.component'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'
import {MovementFacade} from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import {Subscription, tap} from 'rxjs'
import {ElementSkeletonComponent} from '@shared/ui/common/element-skeleton/element-skeleton.component'
import {Card} from 'primeng/card'

@Component({
    selector: 'app-vehicle-movements-list',
    templateUrl: './vehicle-movements-list.page.html',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        ReactiveFormsModule,
        TranslatePipe,
        InputTextModule,
        ToggleButtonModule,
        SelectModule,
        MovementElementComponent,
        Select,
        Button,
        DatePicker,
        VehicleElementComponent,
        ElementSkeletonComponent,
        Card,
    ],
})
export class VehicleMovementsListPage extends GenericListComponent implements OnDestroy {
    protected readonly facade: VehicleFacade = inject(VehicleFacade)
    protected readonly movementFacade: MovementFacade = inject(MovementFacade)

    private readonly subscriptions: Subscription = new Subscription()

    protected readonly vehicle: WritableSignal<VehicleModel | undefined> = signal(undefined)
    protected readonly vehicleLoading: WritableSignal<boolean> = signal(false)

    public constructor() {
        super()

        this.form = this.initForm()

        this.loadData()
        this.handleMovementActions()
    }

    protected initForm(): FormGroup {
        return this.formBuilder.group({
            typeSearched: this.formBuilder.control(this.facade.vehicleMovementsPageTypeSearchedParam()),
            startDateTimeSearched: this.formBuilder.control(this.facade.vehicleMovementsPageStartDateTimeSearchedParam()),
            endDateTimeSearched: this.formBuilder.control(this.facade.vehicleMovementsPageEndDateTimeSearchedParam()),
            visibilitySearched: this.formBuilder.control(this.facade.vehicleMovementsPageVisibilitySearchedParam()),
        })
    }

    protected loadData(): void {
        const id: string | undefined = this.route.snapshot.params['vehicleId']
        this.subscriptions.add(
            this.facade.fetchVehicle(id!).pipe(
                withLoading(this.vehicleLoading),
            ).subscribe( (vehicle: VehicleModel): void => this.vehicle.set(vehicle) ),
        )
        this.facade.fetchVehicleMovementsPage(id!, undefined, undefined)
    }

    private handleMovementActions(): void {
        this.subscriptions.add(
            this.movementFacade.handleMovementFirstPageReload().pipe(
                tap((): void => {
                    this.facade.fetchVehicleMovementsPage(
                        this.route.snapshot.params['vehicleId'],
                        undefined,
                        undefined,
                    )
                }),
            ).subscribe(),
        )

        this.subscriptions.add(
            this.movementFacade.handleMovementCurrentPageReload().pipe(
                tap((): void => {
                    this.facade.fetchVehicleMovementsPage(
                        this.route.snapshot.params['vehicleId'],
                        this.facade.vehicleMovementsPage()?.pageNumber,
                        this.facade.vehicleMovementsPage()?.pageSize,
                    )
                }),
            ).subscribe(),
        )
    }

    protected loadPage(pageEvent: PageEventModel): void {
        this.facade.inputMovementsPageSearchParameters(
            this.typeSearched.value,
            this.startDateTimeSearched.value,
            this.endDateTimeSearched.value,
            this.visibilitySearched.value,
        )
        this.facade.fetchVehicleMovementsPage(
            this.route.snapshot.params['vehicleId'], pageEvent.pageNumber, pageEvent.pageSize,
        )
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }

    protected get typeSearched(): FormControl {
        return this.form.get('typeSearched') as FormControl
    }

    protected get startDateTimeSearched(): FormControl {
        return this.form.get('startDateTimeSearched') as FormControl
    }

    protected get endDateTimeSearched(): FormControl {
        return this.form.get('endDateTimeSearched') as FormControl
    }

    protected get visibilitySearched(): FormControl {
        return this.form.get('visibilitySearched') as FormControl
    }
}
