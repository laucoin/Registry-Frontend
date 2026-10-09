import { Component, computed, inject, OnDestroy, Signal, signal, WritableSignal, model, ModelSignal } from '@angular/core'
import {FieldTree, FormField} from '@angular/forms/signals'
import {MovementFacade} from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import {MovementModel} from '@shared/models/model/movement.model'
import {MovementDto} from '@pages/projects/[projectId]/movements/data/dto/movement.dto'
import {
    createMovementForm,
    driversOf,
    emptyGuest,
    emptyMovementFormModel,
    interpretedPresence,
    isContentSelection,
    isReasonRequired,
    MovementFormModel,
    MovementGuestModel,
    MovementVehicleModel,
    toMovementDto,
    toMovementFormModel,
    withKind,
} from '@pages/projects/[projectId]/movements/movement-form/movement.form'
import {CustomDatetimeModel} from '@shared/models/model/custom-datetime.model'
import {FormModelHelper} from '@shared/helpers/form/form-model.helper'
import {Button} from 'primeng/button'
import {CardModule} from 'primeng/card'
import {DividerModule} from 'primeng/divider'
import {FieldErrorComponent} from '@shared/ui/common/field-error/field-error.component'
import {InputTextModule} from 'primeng/inputtext'
import {TranslocoPipe} from '@jsverse/transloco'
import {Select, SelectModule} from 'primeng/select'
import {DatePicker} from 'primeng/datepicker'
import {SelectItem} from 'primeng/api'
import {ParticipantModel} from '@shared/models/model/participant.model'
import {RegistryRequiredDirective} from '@shared/directives/registry-required.directive'
import {MovementContentModel} from '@shared/models/model/movement-content.model'
import {ProjectModel} from '@shared/models/model/project.model'
import {VehicleModel} from '@shared/models/model/vehicle.model'
import {ProjectHelper} from '@shared/helpers/project.helper'
import {DateFormatPipe} from '@shared/helpers/pipe/date-format.pipe'
import {BaseFormComponent} from '@shared/ui/base/base-form.component'
import {MovementContentFieldComponent} from '@pages/projects/[projectId]/movements/movement-form/movement-content-field/movement-content-field.component'
import {PluralTranslationPipe} from '@shared/helpers/pipe/plural-translation.pipe'
import {FormTitlePipe} from '@shared/helpers/pipe/form-title.pipe'
import {FormButtonPipe} from '@shared/helpers/pipe/form-button.pipe'
import {AutoComplete} from 'primeng/autocomplete'
import {InputGroup} from 'primeng/inputgroup'
import {InputGroupAddon} from 'primeng/inputgroupaddon'
import {VehicleHelper} from '@shared/helpers/vehicle.helper'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {ProgressSpinner} from 'primeng/progressspinner'
import {Step, StepItem, StepPanel, Stepper} from 'primeng/stepper'
import {FormIconPipe} from '@shared/helpers/pipe/form-icon.pipe'
import {RadioButton} from 'primeng/radiobutton'
import {ParticipantTypeEnum} from '@shared/models/enumeration/participant-type.enum'
import {ProjectOptionEnum} from '@shared/models/enumeration/project-option.enum'
import {PresenceStatusEnum} from '@shared/models/enumeration/presence-status.enum'

import {withLoading} from '@shared/helpers/rx.helper'
import {FormErrorComponent} from '@shared/ui/common/form-error/form-error.component'

/**
 * Purpose: Page with the form to create or edit a movement.
 * Scope: Builds the form, submits it through the facade and navigates back.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-movement-form',
    imports: [
        Button,
        CardModule,
        DividerModule,
        FieldErrorComponent,
        InputTextModule,
        FormField,
        TranslocoPipe,
        SelectModule,
        Select,
        DatePicker,
        RegistryRequiredDirective,
        MovementContentFieldComponent,
        TranslocoPipe,
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
        FormErrorComponent,
    ],
    templateUrl: './movement-form.page.html',
    styleUrl: './movement-form.page.css',
})
export class MovementFormPage extends BaseFormComponent implements OnDestroy {
    protected readonly facade: MovementFacade = inject(MovementFacade)

    protected readonly VehicleHelper: typeof VehicleHelper = VehicleHelper
    protected readonly ParticipantTypeEnum: typeof ParticipantTypeEnum = ParticipantTypeEnum

    protected readonly now: Date = new Date()
    protected readonly movement: WritableSignal<MovementModel | undefined> = signal(undefined)
    protected readonly contextProject: WritableSignal<ProjectModel | undefined> = signal(undefined)
    protected readonly model: WritableSignal<MovementFormModel> = signal(emptyMovementFormModel(this.now))
    protected readonly form: FieldTree<MovementFormModel> = createMovementForm(this.model, {
        project: this.contextProject,
        formatDate: (date: CustomDatetimeModel): string | undefined => this.datePipe.transform(date),
        editing: (): boolean => GenericHelper.nonNull(this.idParam),
    })

    protected readonly reasonRequired: Signal<boolean> = computed((): boolean => isReasonRequired(this.model().information))
    protected readonly isContentSelection: Signal<boolean> = computed((): boolean => isContentSelection(this.model().information))
    protected readonly interpretedMovementType: Signal<PresenceStatusEnum[]> = computed(
        (): PresenceStatusEnum[] => interpretedPresence(this.model().information.type),
    )
    protected readonly drivers: Signal<SelectItem<ParticipantModel>[]> = computed(
        (): SelectItem<ParticipantModel>[] => driversOf(this.model()),
    )
    private readonly hasVehicleOption: Signal<boolean> = computed((): boolean => ProjectHelper.hasOption(
        this.sessionFacade.selectedProject(),
        ProjectOptionEnum.VEHICLE,
    ))
    protected readonly isEligibleToVehicle: Signal<boolean> = computed((): boolean =>
        this.hasVehicleOption()
        || (this.movement()?.content.some((content: MovementContentModel): boolean => GenericHelper.nonNull(
            content.vehicle)) ?? false),
    )

    protected readonly activeTab: ModelSignal<number> = model<number>( 1 )

    public constructor() {
        super()

        this.loadData()

        this.handleLoadedElement()
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

    protected handleTypeChange(type: string): void {
        this.model.update((current: MovementFormModel): MovementFormModel =>
            withKind(current, type, current.information.contentType))
    }

    protected handleContentTypeChange(contentType: ParticipantTypeEnum): void {
        this.model.update((current: MovementFormModel): MovementFormModel =>
            withKind(current, current.information.type, contentType))
    }

    protected handleLoadedElement(): void {
        if (!GenericHelper.nonNull(this.idParam)) {
            this.applyMovement(undefined)
        }
    }

    private applyMovement(movement: MovementModel | undefined): void {
        this.contextProject.set(movement?.project || this.sessionFacade.selectedProject())
        if (movement) this.model.set(toMovementFormModel(movement))
    }

    protected submit(): void {
        if (this.saving() || this.loading()) return

        if (GenericHelper.nonNull(this.idParam) && !this.movement()) return

        if (!this.sectionsValid()) {
            this.logInvalidForm(this.model())
            return
        }

        const dto: MovementDto = toMovementDto(this.model())
        this.save(this.movement() ? this.facade.updateMovement(this.movement()!.id, dto) : this.facade.createMovement(dto))
    }

    private sectionsValid(): boolean {
        const validity: boolean[] = [
            this.isFormValid(this.form.information),
            this.isFormValid(this.form.content),
            this.isFormValid(this.form.vehicles),
        ]
        return validity.every(Boolean)
    }

    protected handleReasonsAndActivitiesSearch(textSearched: string | undefined): void {
        this.facade.searchReasonsAndActivities(
            textSearched,
            this.model().information.type,
            this.model().information.contentType,
        )
    }

    protected handleParticipantsAndGroupsSearch(textSearched: string | undefined): void {
        this.facade.searchParticipantsAndGroups(
            this.model().information.contentType,
            textSearched,
        )
    }

    protected handleVehiclesSearch(searched: string | undefined): void {
        this.facade.searchVehicles(searched)
    }

    protected addGuest(participant: ParticipantModel | undefined = undefined): void {
        this.model.update((current: MovementFormModel): MovementFormModel => ({
            ...current,
            content: {...current.content, guests: [...current.content.guests, emptyGuest(participant)]},
        }))
    }

    protected removeGuest(index: number): void {
        this.model.update((current: MovementFormModel): MovementFormModel => ({
            ...current,
            content: {
                ...current.content,
                guests: current.content.guests.filter((_: MovementGuestModel, position: number): boolean => position !== index),
            },
        }))
    }

    protected addVehicle(vehicle: VehicleModel): void {
        this.model.update((current: MovementFormModel): MovementFormModel => ({
            ...current,
            vehicles: [...current.vehicles, {vehicle: FormModelHelper.copy(vehicle), driver: null}],
        }))
    }

    protected removeVehicle(index: number): void {
        this.model.update((current: MovementFormModel): MovementFormModel => ({
            ...current,
            vehicles: current.vehicles.filter((_: MovementVehicleModel, position: number): boolean => position !== index),
        }))
    }

    protected get idParam(): string | undefined {
        return this.route.snapshot.params['movementId']
    }
}
