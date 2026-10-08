import { Component, inject, OnDestroy, signal, WritableSignal } from '@angular/core'
import {VehicleFacade} from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms'
import {RegistryValidators} from '@shared/helpers/registry.validator'
import {VehicleDto} from '@pages/projects/[projectId]/configuration/vehicles/data/dto/vehicle.dto'
import {Button} from 'primeng/button'
import {CardModule} from 'primeng/card'
import {DividerModule} from 'primeng/divider'
import {FormComponent} from '@shared/ui/common/form/form.component'
import {FormFieldErrorComponent} from '@shared/ui/common/form-field-error/form-field-error.component'
import {InputTextModule} from 'primeng/inputtext'
import {TranslatePipe} from '@ngx-translate/core'
import {FormHelper} from '@shared/helpers/form.helper'
import {VehicleModel} from '@shared/models/model/vehicle.model'
import {RegistryRequiredDirective} from '@shared/directives/registry-required.directive'
import {ProjectModel} from '@shared/models/model/project.model'
import {InputMask} from 'primeng/inputmask'
import {DateFormatPipe} from '@shared/helpers/pipe/date-format.pipe'
import {GenericFormComponent} from '@shared/ui/base/generic-form.component'
import {withLoading} from '@shared/helpers/rx.helper'
import {FormTitlePipe} from '@shared/helpers/pipe/form-title.pipe'
import {FormButtonPipe} from '@shared/helpers/pipe/form-button.pipe'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {DateTimeFieldComponent} from '@shared/ui/common/date-time-field/date-time-field.component'
import {FormIconPipe} from '@shared/helpers/pipe/form-icon.pipe'

@Component({
    selector: 'app-vehicle-form',
    imports: [
        Button,
        CardModule,
        DividerModule,
        FormComponent,
        FormFieldErrorComponent,
        FormsModule,
        InputTextModule,
        TranslatePipe,
        ReactiveFormsModule,
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
export class VehicleFormPage extends GenericFormComponent<VehicleModel, VehicleDto> implements OnDestroy {
    protected readonly facade: VehicleFacade = inject(VehicleFacade)

    protected readonly form: FormGroup
    protected readonly vehicle: WritableSignal<VehicleModel | undefined> = signal(undefined)

    public constructor() {
        super()

        this.form = this.initForm()

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

    protected initForm(): FormGroup {
        return this.formBuilder.group({
            licensePlate: this.formBuilder.control(
                undefined,
                [Validators.required, Validators.maxLength(20), RegistryValidators.nonBlank()],
            ),
            brand: this.formBuilder.control(
                undefined,
                [Validators.required, Validators.maxLength(150), RegistryValidators.nonBlank()],
            ),
            model: this.formBuilder.control(
                undefined,
                [Validators.required, Validators.maxLength(150), RegistryValidators.nonBlank()],
            ),
            beginDateTime: this.formBuilder.control(undefined, [RegistryValidators.dateRequiredForTime()]),
            endDateTime: this.formBuilder.control(undefined, [RegistryValidators.dateRequiredForTime()]),
        }, {
            validators: [RegistryValidators.beginDateBeforeEndDate('beginDateTime', 'endDateTime')],
        })
    }

    protected handleLoadedElement(): void {
        if (!GenericHelper.nonNull(this.idParam)) {
            this.applyVehicle(undefined)
        }
    }

    private applyVehicle(vehicle: VehicleModel | undefined): void {
        const contextProject: ProjectModel | undefined = vehicle?.project || this.registryFacade.selectedProject()
        this.addProjectDateValidators(contextProject, this.beginDateTime)
        this.addProjectDateValidators(contextProject, this.endDateTime)
        this.fillForm(vehicle)
    }

    protected fillForm(element: VehicleModel | undefined): void {
        if (!element) return

        this.licensePlate.patchValue(element?.licensePlate)
        this.brand.patchValue(element?.brand)
        this.model.patchValue(element?.model)
        this.beginDateTime.patchValue(element?.startAvailability)
        this.endDateTime.patchValue(element?.endAvailability)
    }

    protected submit(): void {
        if (this.saving() || this.loading()) return

        const editing: boolean = GenericHelper.nonNull(this.idParam)
        if (editing && !this.vehicle()) return

        if (!FormHelper.isFormValid(this.form)) {
            this.logInvalidForm(this.form.value)
            return
        }

        const dto: VehicleDto = this.buildDto()
        this.save(editing ? this.facade.updateVehicle(this.vehicle()!.id, dto) : this.facade.createVehicle(dto))
    }

    protected buildDto(): VehicleDto {
        return {
            licensePlate: this.licensePlate.value,
            brand: this.brand.value,
            model: this.model.value,
            startAvailability: this.beginDateTime.value,
            endAvailability: this.endDateTime.value,
        }
    }

    protected get idParam(): string | undefined {
        return this.route.snapshot.params['vehicleId']
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }

    protected get licensePlate(): FormControl {
        return this.form.get('licensePlate') as FormControl
    }

    protected get brand(): FormControl {
        return this.form.get('brand') as FormControl
    }

    protected get model(): FormControl {
        return this.form.get('model') as FormControl
    }

    protected get beginDateTime(): FormControl {
        return this.form.get('beginDateTime') as FormControl
    }

    protected get endDateTime(): FormControl {
        return this.form.get('endDateTime') as FormControl
    }
}
