import { Component, inject, OnDestroy, signal, WritableSignal } from '@angular/core'
import {VehicleFacade} from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import { FieldTree, FormField } from '@angular/forms/signals'
import {Button} from 'primeng/button'
import {CardModule} from 'primeng/card'
import {DividerModule} from 'primeng/divider'
import {FormComponent} from '@shared/ui/common/form/form.component'
import {FieldErrorComponent} from '@shared/ui/common/field-error/field-error.component'
import {InputTextModule} from 'primeng/inputtext'
import {TranslocoPipe} from '@jsverse/transloco'
import {VehicleDto} from '@pages/projects/[projectId]/configuration/vehicles/data/dto/vehicle.dto'
import {CustomDatetimeModel} from '@shared/models/model/custom-datetime.model'
import {VehicleModel} from '@shared/models/model/vehicle.model'
import {RegistryRequiredDirective} from '@shared/directives/registry-required.directive'
import {ProjectModel} from '@shared/models/model/project.model'
import {InputMask} from 'primeng/inputmask'
import {DateFormatPipe} from '@shared/helpers/pipe/date-format.pipe'
import {BaseFormComponent} from '@shared/ui/base/base-form.component'
import {
    createVehicleForm,
    toVehicleDto,
    toVehicleFormModel,
    VehicleFormModel,
} from '@pages/projects/[projectId]/configuration/vehicles/vehicle-form/vehicle.form'
import {withLoading} from '@shared/helpers/rx.helper'
import {FormTitlePipe} from '@shared/helpers/pipe/form-title.pipe'
import {FormButtonPipe} from '@shared/helpers/pipe/form-button.pipe'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {DateTimeFieldComponent} from '@shared/ui/common/date-time-field/date-time-field.component'
import {FormIconPipe} from '@shared/helpers/pipe/form-icon.pipe'

/**
 * Purpose: Page with the form to create or edit a vehicle.
 * Scope: Builds the form, submits it through the facade and navigates back.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-vehicle-form',
    imports: [
        Button,
        CardModule,
        DividerModule,
        FormComponent,
        FieldErrorComponent,
        InputTextModule,
        TranslocoPipe,
        FormField,
        RegistryRequiredDirective,
        InputMask,
        DateFormatPipe,
        FormTitlePipe,
        FormButtonPipe,
        DateTimeFieldComponent,
        FormIconPipe,
    ],
    templateUrl: './vehicle-form.page.html',
})
export class VehicleFormPage extends BaseFormComponent implements OnDestroy {
    protected readonly facade: VehicleFacade = inject(VehicleFacade)

    protected readonly vehicle: WritableSignal<VehicleModel | undefined> = signal(undefined)
    protected readonly contextProject: WritableSignal<ProjectModel | undefined> = signal(undefined)
    protected readonly model: WritableSignal<VehicleFormModel> = signal(toVehicleFormModel())
    protected readonly form: FieldTree<VehicleFormModel> = createVehicleForm(this.model, {
        project: this.contextProject,
        formatDate: (date: CustomDatetimeModel): string | undefined => this.datePipe.transform(date),
    })

    public constructor() {
        super()

        this.loadData()

        this.handleLoadedElement()
    }

    protected override loadData(): void {
        if (GenericHelper.nonNull(this.idParam)) {
            this.subscriptions.add(
                this.facade.fetchVehicle(this.idParam!).pipe(
                    withLoading(this.loading),
                ).subscribe( (vehicle: VehicleModel): void => {
                    this.vehicle.set(vehicle)
                    this.applyVehicle(vehicle)
                } ),
            )
        }
    }

    protected handleLoadedElement(): void {
        if (!GenericHelper.nonNull(this.idParam)) {
            this.applyVehicle(undefined)
        }
    }

    private applyVehicle(vehicle: VehicleModel | undefined): void {
        this.contextProject.set(vehicle?.project || this.sessionFacade.selectedProject())
        if (vehicle) this.model.set(toVehicleFormModel(vehicle))
    }

    protected submit(): void {
        if (this.saving() || this.loading()) return

        const editing: boolean = GenericHelper.nonNull(this.idParam)
        if (editing && !this.vehicle()) return

        if (!this.isFormValid(this.form)) {
            this.logInvalidForm(this.model())
            return
        }

        const dto: VehicleDto = toVehicleDto(this.model())
        this.save(editing ? this.facade.updateVehicle(this.vehicle()!.id, dto) : this.facade.createVehicle(dto))
    }

    protected get idParam(): string | undefined {
        return this.route.snapshot.params['vehicleId']
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }
}
