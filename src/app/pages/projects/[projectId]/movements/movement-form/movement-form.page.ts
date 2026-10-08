import { Component, computed, inject, OnDestroy, Signal, signal, WritableSignal} from '@angular/core'
import {FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms'
import {FormHelper} from '@shared/helpers/form.helper'
import {MovementFacade} from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import {MovementModel} from '@shared/models/model/movement.model'
import {MovementDto} from '@pages/projects/[projectId]/movements/data/dto/movement.dto'
import {Button} from 'primeng/button'
import {CardModule} from 'primeng/card'
import {DividerModule} from 'primeng/divider'
import {FormFieldErrorComponent} from '@shared/ui/common/form-field-error/form-field-error.component'
import {InputTextModule} from 'primeng/inputtext'
import {TranslatePipe} from '@ngx-translate/core'
import {MovementContentDto} from '@pages/projects/[projectId]/movements/data/dto/movement-content.dto'
import {Select, SelectModule} from 'primeng/select'
import {DatePicker} from 'primeng/datepicker'
import {map, tap} from 'rxjs'
import {SelectItem} from 'primeng/api'
import {ParticipantModel} from '@shared/models/model/participant.model'
import {RegistryRequiredDirective} from '@shared/directives/registry-required.directive'
import {MovementContentModel} from '@shared/models/model/movement-content.model'
import {ProjectModel} from '@shared/models/model/project.model'
import {VehicleModel} from '@shared/models/model/vehicle.model'
import {ProjectHelper} from '@shared/helpers/project.helper'
import {DateFormatPipe} from '@shared/helpers/pipe/date-format.pipe'
import {GenericFormComponent} from '@shared/ui/base/generic-form.component'
import {ParticipantHelper} from '@shared/helpers/participant.helper'
import {MovementContentFieldComponent} from '@pages/projects/[projectId]/movements/movement-form/movement-content-field/movement-content-field.component'
import {PluralTranslationPipe} from '@shared/helpers/pipe/plural-translation.pipe'
import {FormTitlePipe} from '@shared/helpers/pipe/form-title.pipe'
import {FormButtonPipe} from '@shared/helpers/pipe/form-button.pipe'
import {AutoComplete} from 'primeng/autocomplete'
import {InputGroup} from 'primeng/inputgroup'
import {InputGroupAddon} from 'primeng/inputgroupaddon'
import {VehicleHelper} from '@shared/helpers/vehicle.helper'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {MovementReasonModel} from '@pages/projects/[projectId]/movements/data/model/movement-reason.model'
import {ProgressSpinner} from 'primeng/progressspinner'
import {Step, StepItem, StepPanel, Stepper} from 'primeng/stepper'
import {FormIconPipe} from '@shared/helpers/pipe/form-icon.pipe'
import {RadioButton} from 'primeng/radiobutton'
import {ParticipantTypeEnum} from '@shared/models/enumeration/participant-type.enum'
import {ParticipantDto} from '@pages/projects/[projectId]/configuration/participants/data/dto/participant.dto'
import {DateHelper} from '@shared/helpers/date.helper'
import {MovementTypeEnum} from '@shared/models/enumeration/movement-type.enum'
import {ProjectOptionEnum} from '@shared/models/enumeration/project-option.enum'
import {PresenceStatusEnum} from '@shared/models/enumeration/presence-status.enum'

import {withLoading} from '@shared/helpers/rx.helper'
import {FormErrorComponent} from '@shared/ui/common/form-error/form-error.component'

@Component({
    selector: 'app-movement-form',
    imports: [
        Button,
        CardModule,
        DividerModule,
        FormFieldErrorComponent,
        InputTextModule,
        ReactiveFormsModule,
        TranslatePipe,
        SelectModule,
        Select,
        DatePicker,
        RegistryRequiredDirective,
        MovementContentFieldComponent,
        TranslatePipe,
        DateFormatPipe,
        MovementContentFieldComponent,
        PluralTranslationPipe,
        FormTitlePipe,
        FormButtonPipe,
        AutoComplete,
        InputGroup,
        InputGroupAddon,
        ProgressSpinner,
        Stepper,
        StepItem,
        Step,
        StepPanel,
        FormIconPipe,
        RadioButton,
        FormsModule,
        FormErrorComponent,
    ],
    templateUrl: './movement-form.page.html',
    styleUrl: './movement-form.page.css',
})
export class MovementFormPage extends GenericFormComponent<MovementModel, MovementDto> implements OnDestroy {
    protected readonly facade: MovementFacade = inject(MovementFacade)

    protected readonly VehicleHelper: typeof VehicleHelper = VehicleHelper
    protected readonly ParticipantTypeEnum: typeof ParticipantTypeEnum = ParticipantTypeEnum

    protected readonly now: Date = new Date()
    protected readonly informationForm: FormGroup
    protected readonly contentForm: FormGroup
    protected readonly vehicleForm: FormGroup

    protected readonly movement: WritableSignal<MovementModel | undefined> = signal(undefined)

    protected readonly reasonRequired: WritableSignal<boolean> = signal(true)
    protected readonly isContentSelection: WritableSignal<boolean> = signal(true)
    protected readonly selectedReason: WritableSignal<MovementReasonModel | undefined> = signal(undefined)
    private readonly hasVehicleOption: Signal<boolean> = computed((): boolean => ProjectHelper.hasOption(
        this.registryFacade.selectedProject(),
        ProjectOptionEnum.VEHICLE,
    ))
    protected readonly isEligibleToVehicle: Signal<boolean> = computed((): boolean =>
        this.hasVehicleOption()
        || (this.movement()?.content.some((content: MovementContentModel): boolean => GenericHelper.nonNull(
            content.vehicle)) ?? false),
    )
    protected readonly drivers: WritableSignal<SelectItem<ParticipantModel>[]> = signal([])

    protected readonly interpretedMovementType: WritableSignal<PresenceStatusEnum[]> = signal([])

    protected readonly activeTab: WritableSignal<number> = signal(1)

    public constructor() {
        super()

        this.informationForm = this.initForm()
        this.contentForm = this.initContentForm()
        this.vehicleForm = this.initVehicleForm()

        this.loadData()

        this.handleLoadedElement()
        this.handleContentChange()
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }

    protected override loadData(): void {
        if (GenericHelper.nonNull(this.idParam)) {
            this.subscriptions.add(
                this.facade.fetchMovement(this.idParam!).pipe(
                    withLoading(this.loading),
                ).subscribe((movement: MovementModel): void => {
                    this.movement.set(movement)
                    this.applyMovement(movement)
                }),
            )
        }
    }

    protected initForm(): FormGroup {
        return this.formBuilder.group({
            dateTime: this.formBuilder.control(this.now, [Validators.required]),
            type: this.formBuilder.control(undefined, [Validators.required]),
            contentType: this.formBuilder.control(ParticipantTypeEnum.REGISTERED, [Validators.required]),
        })
    }

    private initContentForm(): FormGroup {
        return this.formBuilder.group({
            reason: this.formBuilder.control(undefined, []),
            participantContent: this.formBuilder.control([], []),
            guestContent: this.formBuilder.array([], []),
        })
    }

    private initVehicleForm(): FormGroup {
        return this.formBuilder.group({
            vehiclesWithDrivers: this.formBuilder.array([], []),
        })
    }

    protected handleTypeChange(type: string | undefined): void {
        this.updateContentAndReasonRules(type, this.contentType.value)

        if (type == MovementTypeEnum.IN) this.interpretedMovementType.set([PresenceStatusEnum.IN])
        else if (type == MovementTypeEnum.OUT) this.interpretedMovementType.set([PresenceStatusEnum.UNAVAILABLE, PresenceStatusEnum.OUT])
        else this.interpretedMovementType.set([])
    }

    protected handleContentTypeChange(contentType: string): void {
        this.updateContentAndReasonRules(this.type.value, contentType)
    }

    private updateContentAndReasonRules(type: string | undefined, contentType: string): void {
        this.selectedReason.set(undefined)
        this.reason.patchValue(undefined)

        this.isContentSelection.set(contentType == ParticipantTypeEnum.REGISTERED || type == 'OUT')

        if (this.isContentSelection()) {
            this.guestContent.clear()
            this.guestContent.clearValidators()
            this.participantContent.addValidators([Validators.required])
        } else {
            this.participantContent.clearValidators()
            this.guestContent.addValidators([Validators.required])
            if (this.guestContent.length == 0) this.addGuest()
        }

        this.reasonRequired.set(
            type == MovementTypeEnum.OUT && contentType == ParticipantTypeEnum.REGISTERED ||
            type == MovementTypeEnum.IN && contentType == ParticipantTypeEnum.GUEST,
        )

        if (this.reasonRequired()) {
            this.reason.addValidators([Validators.required])
        } else {
            this.reason.clearValidators()
        }
    }

    protected handleLoadedElement(): void {
        if (!GenericHelper.nonNull(this.idParam)) {
            this.applyMovement(undefined)
        }
    }

    private applyMovement(movement: MovementModel | undefined): void {
        const contextProject: ProjectModel | undefined = movement?.project || this.registryFacade.selectedProject()
        this.addProjectDateValidators(contextProject, this.dateTime)
        this.fillForm(movement)
    }

    private handleContentChange(): void {
        this.subscriptions.add(
            this.participantContent.valueChanges.pipe(
                map((content: MovementContentModel[]): MovementContentModel[] => content.filter((element: MovementContentModel): boolean => element.participant?.major ?? true)),
                tap((item: MovementContentModel[]): void => this.drivers.set(
                    item.map((element: MovementContentModel): SelectItem<ParticipantModel> => ParticipantHelper.toSelectItem(
                        element.participant)),
                )),
            ).subscribe(),
        )
    }

    protected fillForm(element: MovementModel | undefined): void {
        if (!element) return

        this.dateTime.patchValue(new Date(element?.dateTime))
        this.type.patchValue(element.type.value)
        this.type.disable()
        this.contentType.patchValue(element.contentType)
        this.contentType.disable()
        if (element.type.value == MovementTypeEnum.IN && element.contentType == ParticipantTypeEnum.GUEST) {
            element.content.forEach((content: MovementContentModel): void => this.addGuest(content.participant))
        } else {
            this.participantContent.patchValue(element.content)
        }
        this.updateContentAndReasonRules(element.type.value, element.contentType)
        this.selectedReason.set(element.reason)
        this.reason.patchValue(element.reason)
        this.buildVehiclesFromLoadedMovement()
    }

    protected submit(): void {
        if (this.saving() || this.loading()) return

        if (GenericHelper.nonNull(this.idParam) && !this.movement()) return

        switch (true) {
            case !FormHelper.isFormValid(this.informationForm):
                this.logInvalidForm(this.informationForm.value)
                return
            case !FormHelper.isFormValid(this.contentForm):
                this.logInvalidForm(this.contentForm.value)
                return
            case !FormHelper.isFormValid(this.vehicleForm):
                this.logInvalidForm(this.vehicleForm.value)
                return
        }

        const dto: MovementDto = this.buildDto()
        this.save(this.movement() ? this.facade.updateMovement(this.movement()!.id, dto) : this.facade.createMovement(dto))
    }

    protected buildDto(): MovementDto {
        return {
            dateTime: this.dateTime.value,
            type: this.type.value,
            reason: this.selectedReason()?.kind === 'REASON' ? this.selectedReason()?.value : undefined,
            activityId: this.selectedReason()?.kind === 'ACTIVITY' ? this.selectedReason()?.value : undefined,
            contentType: this.contentType.value,
            content: this.participantContent.value?.map((content: MovementContentModel): MovementContentDto => ({
                poolName: content.poolName,
                participantId: content.participant.id,
                vehicleId: this.getVehicleFromDriver(content.participant.id),
            })),
            guests: this.guestContent.value.map((guest: ParticipantDto): ParticipantDto => ({
                id: guest.id,
                firstName: guest.firstName,
                lastName: guest.lastName,
                birthday: DateHelper.getDate(new Date(guest.birthday)),
            })),
        }
    }

    private getVehicleFromDriver(driverId: string): string | undefined {
        const group: FormGroup | undefined = this.vehiclesWithDrivers.value
            .find((formGroup: FormGroup): boolean => Object.values(formGroup)[1].id === driverId)
        return group ? Object.values(group)[0]?.id : undefined
    }

    private buildVehiclesFromLoadedMovement(): void {
        this.vehiclesWithDrivers.clear()
        this.movement()?.content
            .filter((content: MovementContentModel): boolean => !!content.vehicle)
            .forEach((content: MovementContentModel): void => {
                this.vehiclesWithDrivers.push(
                    this.formBuilder.group({
                        vehicle: this.formBuilder.control(content.vehicle!, [Validators.required]),
                        driver: this.formBuilder.control(content.participant!, [Validators.required]),
                    }),
                )
            })
    }

    protected handleReasonsAndActivitiesSearch(textSearched: string | undefined): void {
        this.facade.searchReasonsAndActivities(
            textSearched,
            this.type.value,
            this.contentType.value,
        )
    }

    protected handleParticipantsAndGroupsSearch(textSearched: string | undefined): void {
        this.facade.searchParticipantsAndGroups(
            this.contentType.value,
            textSearched,
        )
    }

    protected handleVehiclesSearch(searched: string | undefined): void {
        this.facade.searchVehicles(searched)
    }

    protected addGuest(participant: ParticipantModel | undefined = undefined): void {
        this.guestContent.push(this.formBuilder.group({
            id: this.formBuilder.control(participant?.id, []),
            firstName: this.formBuilder.control(participant?.firstName, [Validators.required]),
            lastName: this.formBuilder.control(participant?.lastName, [Validators.required]),
            birthday: this.formBuilder.control(
                participant?.birthday ? new Date(participant?.birthday) : undefined,
                [Validators.required],
            ),
        }))
    }

    protected removeGuest(index: number): void {
        this.guestContent.removeAt(index)
    }

    protected guestFormGroup(index: number): FormGroup {
        return this.guestContent.at(index) as FormGroup
    }

    protected participantId(index: number): FormControl {
        return this.guestFormGroup(index).get('id') as FormControl
    }

    protected firstName(index: number): FormControl {
        return this.guestFormGroup(index).get('firstName') as FormControl
    }

    protected lastName(index: number): FormControl {
        return this.guestFormGroup(index).get('lastName') as FormControl
    }

    protected birthday(index: number): FormControl {
        return this.guestFormGroup(index).get('birthday') as FormControl
    }

    protected addVehicle(vehicle: VehicleModel): void {
        this.vehiclesWithDrivers.push(this.formBuilder.group({
            vehicle: this.formBuilder.control(vehicle, [Validators.required]),
            driver: this.formBuilder.control(undefined, [Validators.required]),
        }))
    }

    protected removeVehicle(index: number): void {
        this.vehiclesWithDrivers.removeAt(index)
    }

    protected vehicleDriverFormGroup(index: number): FormGroup {
        return this.vehiclesWithDrivers.at(index) as FormGroup
    }

    protected vehicle(index: number): FormControl {
        return this.vehicleDriverFormGroup(index).get('vehicle') as FormControl
    }

    protected driver(index: number): FormControl {
        return this.vehicleDriverFormGroup(index).get('driver') as FormControl
    }

    protected get idParam(): string | undefined {
        return this.route.snapshot.params['movementId']
    }

    protected get dateTime(): FormControl {
        return this.informationForm.get('dateTime') as FormControl
    }

    protected get type(): FormControl {
        return this.informationForm.get('type') as FormControl
    }

    protected get contentType(): FormControl {
        return this.informationForm.get('contentType') as FormControl
    }

    protected get reason(): FormControl {
        return this.contentForm.get('reason') as FormControl
    }

    protected get participantContent(): FormControl {
        return this.contentForm.get('participantContent') as FormControl
    }

    protected get guestContent(): FormArray {
        return this.contentForm.get('guestContent') as FormArray
    }

    protected get vehiclesWithDrivers(): FormArray {
        return this.vehicleForm.get('vehiclesWithDrivers') as FormArray
    }
}
