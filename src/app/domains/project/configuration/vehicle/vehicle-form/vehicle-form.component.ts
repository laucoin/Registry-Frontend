import {Component, inject, OnDestroy} from '@angular/core'
import {VehicleFacade} from '../data/state/vehicle.facade'
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms'
import {RegistryValidators} from '../../../../../shared/util-tool/util/registry.validator'
import {VehicleDto} from '../data/dto/vehicle.dto'
import {Button} from 'primeng/button'
import {CardModule} from 'primeng/card'
import {DividerModule} from 'primeng/divider'
import {FormComponent} from '../../../../../shared/util-ui/form/form.component'
import {FormFieldErrorComponent} from '../../../../../shared/util-ui/form-field-error/form-field-error.component'
import {InputTextModule} from 'primeng/inputtext'
import {TranslatePipe} from '@ngx-translate/core'
import {FormUtil} from '../../../../../shared/util-tool/util/form.util'
import {VehicleModel} from '../../../../../shared/util-model/model/vehicle.model'
import {RegistryRequiredDirective} from '../../../../../shared/util-tool/directive/registry-required.directive'
import {ProjectModel} from '../../../../../shared/util-model/model/project.model'
import {InputMask} from 'primeng/inputmask'
import {DateFormatPipe} from '../../../../../shared/util-tool/pipe/date-format.pipe'
import {GenericFormComponent} from '../../../../../shared/util-tool/component/generic-form.component'
import {map, Observable} from 'rxjs'
import {CreateVehicle, UpdateVehicle} from '../data/state/vehicle.action'
import {FormTitlePipe} from '../../../../../shared/util-tool/pipe/form-title.pipe'
import {FormButtonPipe} from '../../../../../shared/util-tool/pipe/form-button.pipe'
import {GenericUtil} from '../../../../../shared/util-tool/util/generic.util'
import {DateTimeFieldComponent} from '../../../../../shared/util-ui/date-time-field/date-time-field.component'
import {FormIconPipe} from '../../../../../shared/util-tool/pipe/form-icon.pipe'

@Component({
    selector: 'app-vehicle-form',
    standalone: true,
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
    templateUrl: './vehicle-form.component.html',
})
export class VehicleFormComponent extends GenericFormComponent<VehicleModel, VehicleDto> implements OnDestroy {
    protected readonly facade: VehicleFacade = inject(VehicleFacade)

    protected readonly form: FormGroup

    public constructor() {
        super()

        this.form = this.initForm()

        this.loadData()

        this.handleLoadedElement()
    }

    protected override loadData(): void {
        this.facade.resetVehicle()

        if (GenericUtil.nonNull(this.idParam)) {
            this.facade.fetchVehicle(this.idParam!)
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
        this.subscriptions.add(
            this.facade.vehicle$.pipe(
                map((vehicle: VehicleModel | undefined): void => {
                    const contextProject: ProjectModel | undefined = vehicle?.project || this.registryFacade.selectedProject()
                    this.addProjectDateValidators(contextProject, this.beginDateTime)
                    this.addProjectDateValidators(contextProject, this.endDateTime)
                    this.fillForm(vehicle)
                }),
            ).subscribe(),
        )
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
        if (!FormUtil.isFormValid(this.form)) {
            console.warn(this.invalidFormMessage, this.form.value)
            return
        }

        const dto: VehicleDto = this.buildDto()
        const observable: Observable<CreateVehicle | UpdateVehicle> =
            this.facade.vehicle()
                ? this.facade.updateVehicle(this.facade.vehicle()!.id!, dto)
                : this.facade.createVehicle(dto)

        this.subscriptions.add(
            observable.pipe(
                map((): void => this.navigateToRedirectUri()),
            ).subscribe(),
        )
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
