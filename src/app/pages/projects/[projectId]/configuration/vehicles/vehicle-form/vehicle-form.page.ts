import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal, WritableSignal } from '@angular/core'
import {VehicleFacade} from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import { FieldTree, FormField } from '@angular/forms/signals'
import {TranslocoPipe} from '@jsverse/transloco'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/input'
import { FieldErrorDirective } from '@shared/directives/field-error.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { FormDialogComponent } from '@shared/ui/common/form-dialog/form-dialog.component'
import {VehicleDto} from '@pages/projects/[projectId]/configuration/vehicles/data/dto/vehicle.dto'
import {CustomDatetimeModel} from '@shared/models/model/custom-datetime.model'
import {VehicleModel} from '@shared/models/model/vehicle.model'
import {ProjectModel} from '@shared/models/model/project.model'
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
import { ETagHelper } from '@shared/helpers/etag.helper'

/**
 * Purpose: Dialog page with the form to create or edit a vehicle, opened over the vehicles list.
 * Scope: Builds the form, submits it through the facade and navigates back.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-vehicle-form',
    imports: [
        FormDialogComponent,
        TranslocoPipe,
        FormField,
        SgdfFieldDirective,
        FieldErrorDirective,
        FormTitlePipe,
        FormButtonPipe,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './vehicle-form.page.html',
})
export class VehicleFormPage extends BaseFormComponent {
    protected override readonly closesToParentRoute: boolean = true
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
            this.facade.fetchVehicle(this.idParam!).pipe(
                    withLoading(this.loading),
                ).pipe( takeUntilDestroyed( this.destroyRef ) ).subscribe( (vehicle: VehicleModel): void => {
                    this.vehicle.set(vehicle)
                    this.applyVehicle(vehicle)
                } )
        }
    }

    protected handleLoadedElement(): void {
        if (!GenericHelper.nonNull(this.idParam)) {
            this.applyVehicle(undefined)
        }
    }

    private applyVehicle(vehicle: VehicleModel | undefined): void {
        this.contextProject.set( this.sessionFacade.selectedProject() )
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
        this.save(editing ? this.facade.updateVehicle(this.vehicle()!.id, dto, ETagHelper.ifMatch(this.vehicle())) : this.facade.createVehicle(dto))
    }

    protected get idParam(): string | undefined {
        return this.route.snapshot.params['vehicleId']
    }
}
