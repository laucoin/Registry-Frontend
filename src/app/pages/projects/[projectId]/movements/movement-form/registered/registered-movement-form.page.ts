import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, model, ModelSignal, Signal, signal, WritableSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/card'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/divider'
import '@sgdf/ui/icon'
import '@sgdf/ui/icon-button'
import '@sgdf/ui/button'
import '@sgdf/ui/option'
import '@sgdf/ui/select'
import '@sgdf/ui/step'
import '@sgdf/ui/stepper'
import '@sgdf/ui/tag'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { MovementDto } from '@pages/projects/[projectId]/movements/data/dto/movement.dto'
import {
    contentOfChoice,
    interpretedPresence,
    reasonChoices,
    reasonKeyOf,
} from '@pages/projects/[projectId]/movements/movement-form/shared/movement-form.shared'
import {
    createRegisteredMovementForm,
    driversOf,
    emptyRegisteredMovementFormModel,
    isRegisteredReasonRequired,
    MovementVehicleModel,
    RegisteredMovementFormModel,
    toRegisteredMovementDto,
    toRegisteredMovementFormModel,
    withRegisteredPrefill,
    withRegisteredType,
} from '@pages/projects/[projectId]/movements/movement-form/registered/registered-movement.form'
import { MovementPrefillService } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-prefill.service'
import { MovementPrefillModel } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-prefill.model'
import { FieldErrorDirective } from '@shared/directives/field-error.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { ETagHelper } from '@shared/helpers/etag.helper'
import { EventHelper } from '@shared/helpers/event.helper'
import { FormModelHelper } from '@shared/helpers/form/form-model.helper'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe'
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { withLoading } from '@shared/helpers/rx.helper'
import { VehicleHelper } from '@shared/helpers/vehicle.helper'
import { ParticipantHelper } from '@shared/helpers/participant.helper'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { GroupModel } from '@shared/models/model/group.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementReasonModel } from '@shared/models/model/movement-reason.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { SelectOptionGroupModel, SelectOptionModel } from '@shared/models/model/select-option.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'
import { BaseFormComponent } from '@shared/ui/base/base-form.component'
import { FormComponent } from '@shared/ui/common/form/form.component'
import { SelectElementsFieldComponent } from '@shared/ui/common/select-elements-field/select-elements-field.component'

/**
 * Purpose: Page with the form to create or edit a movement of registered participants.
 * Scope: Walks through the information, content and vehicle steps, submits through the facade and navigates back.
 * Limits: Holds no domain state, never calls the backend and knows nothing about guests.
 */
@Component( {
    selector: 'app-registered-movement-form',
    imports: [
        FormComponent,
        FormField,
        FieldErrorDirective,
        SgdfFieldDirective,
        SelectElementsFieldComponent,
        TranslocoPipe,
        DateFormatPipe,
        FormTitlePipe,
        FormButtonPipe,
        PluralTranslationPipe,
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
    templateUrl: './registered-movement-form.page.html',
} )
export class RegisteredMovementFormPage extends BaseFormComponent {
    protected readonly facade: MovementFacade = inject( MovementFacade )
    private readonly prefillService: MovementPrefillService = inject( MovementPrefillService )

    protected readonly VehicleHelper: typeof VehicleHelper = VehicleHelper

    protected readonly now: Date = new Date()
    protected readonly movement: WritableSignal<MovementModel | undefined> = signal( undefined )
    protected readonly contextProject: WritableSignal<ProjectModel | undefined> = signal( undefined )
    protected readonly model: WritableSignal<RegisteredMovementFormModel> = signal( emptyRegisteredMovementFormModel( this.now ) )
    protected readonly form: FieldTree<RegisteredMovementFormModel> = createRegisteredMovementForm( this.model, {
        project: this.contextProject,
        formatDate: (date: CustomDatetimeModel): string | undefined => this.datePipe.transform( date ),
        editing: (): boolean => GenericHelper.nonNull( this.idParam ),
    } )

    protected readonly activeTab: ModelSignal<number> = model<number>( 1 )

    protected readonly reasonRequired: Signal<boolean> = computed( (): boolean => isRegisteredReasonRequired( this.model().information ) )
    protected readonly reasonOptions: Signal<MovementReasonModel[]> = computed(
        (): MovementReasonModel[] => reasonChoices( this.facade.searchedReasonAndActivityMetadata(), this.model().content.reason ),
    )
    protected readonly suggestions: Signal<SelectOptionModel<ParticipantModel | GroupModel>[]> = computed(
        (): SelectOptionModel<ParticipantModel | GroupModel>[] => this.facade.searchedParticipantAndGroupMetadata()
            .flatMap( (group: SelectOptionGroupModel<ParticipantModel | GroupModel>): SelectOptionModel<ParticipantModel | GroupModel>[] => group.items ),
    )
    protected readonly interpretedMovementType: Signal<PresenceStatusEnum[]> = computed(
        (): PresenceStatusEnum[] => interpretedPresence( this.model().information.type ),
    )
    protected readonly drivers: Signal<SelectOptionModel<ParticipantModel>[]> = computed(
        (): SelectOptionModel<ParticipantModel>[] => driversOf( this.model() ),
    )
    private readonly hasVehicleOption: Signal<boolean> = this.sessionFacade.selectedProjectHasOption( ProjectOptionEnum.VEHICLE )
    protected readonly vehicleStep: Signal<boolean> = computed( (): boolean =>
        this.hasVehicleOption() || (this.movement()?.content.some( (content: MovementContentModel): boolean => GenericHelper.nonNull( content.vehicle ) ) ?? false),
    )

    protected readonly reasonKeyOf: typeof reasonKeyOf = reasonKeyOf
    protected readonly contentOfChoice: (chosen: ParticipantModel | GroupModel) => MovementContentModel[] = contentOfChoice
    protected readonly identifyContent: (content: MovementContentModel) => string = (content: MovementContentModel): string => content.participant.id
    protected readonly groupOfContent: (content: MovementContentModel) => string | undefined = (content: MovementContentModel): string | undefined => content.poolName
    protected readonly contentLabel: (content: MovementContentModel) => SelectOptionModel<ParticipantModel> =
        (content: MovementContentModel): SelectOptionModel<ParticipantModel> => ParticipantHelper.toSelectItem( content.participant )
    protected readonly groupLabel: (name: string) => string =
        (name: string): string => this.translateService.translate( 'movements.form.content.registered.group', { name } )
    protected readonly participantWarning: (content: MovementContentModel) => string | undefined = (content: MovementContentModel): string | undefined =>
        this.warningOf( 'participant', content.participant.status?.value )

    public constructor () {
        super()

        this.loadData()

        this.handleLoadedElement()
    }

    protected override loadData (): void {
        if (GenericHelper.nonNull( this.idParam )) {
            this.facade.fetchMovement( this.idParam! ).pipe(
                    withLoading( this.loading ),
                ).pipe( takeUntilDestroyed( this.destroyRef ) ).subscribe( (movement: MovementModel): void => {
                    this.movement.set( movement )
                    this.applyMovement( movement )
                } )
        }
    }

    protected handleLoadedElement (): void {
        if (!GenericHelper.nonNull( this.idParam )) this.applyMovement( undefined )
    }

    private applyMovement (movement: MovementModel | undefined): void {
        this.contextProject.set( this.sessionFacade.selectedProject() )
        if (movement) this.model.set( toRegisteredMovementFormModel( movement ) )
        else this.applyPrefill()
    }

    private applyPrefill (): void {
        const prefill: MovementPrefillModel | undefined = this.prefillService.read()
        if (!prefill) return
        this.model.update( (current: RegisteredMovementFormModel): RegisteredMovementFormModel => withRegisteredPrefill( current, prefill ) )
        this.goTo( 2 )
    }

    protected handleTypeChange (event: Event): void {
        this.model.update( (current: RegisteredMovementFormModel): RegisteredMovementFormModel => withRegisteredType( current, EventHelper.valueOf( event ) ) )
    }

    protected handleReasonChoice (event: Event): void {
        const reason: MovementReasonModel | null = this.reasonOptions().find( (option: MovementReasonModel): boolean => reasonKeyOf( option ) === EventHelper.valueOf( event ) ) ?? null
        this.model.update( (current: RegisteredMovementFormModel): RegisteredMovementFormModel => ({ ...current, content: { ...current.content, reason } }) )
    }

    protected handleReasonSearch (query: string): void {
        this.facade.searchReasonsAndActivities( query, this.model().information.type, ParticipantTypeEnum.REGISTERED )
    }

    protected handleParticipantsAndGroupsSearch (searched: { query: string }): void {
        this.facade.searchParticipantsAndGroups( ParticipantTypeEnum.REGISTERED, searched.query )
    }

    protected handleVehicleSearch (query: string): void {
        this.facade.searchVehicles( query )
    }

    protected handleVehicleChoice (event: Event): void {
        const id: string = EventHelper.valueOf( event )
        const vehicle: VehicleModel | undefined = this.facade.searchedVehicleMetadata().find( (option: SelectOptionModel<VehicleModel>): boolean => option.value.id === id )?.value
        if (vehicle) this.addVehicle( vehicle )
        ;(event.target as HTMLElement & { value: string }).value = ''
    }

    protected handleDriverChoice (index: number, event: Event): void {
        const id: string = EventHelper.valueOf( event )
        const driver: ParticipantModel | null = this.drivers().find( (option: SelectOptionModel<ParticipantModel>): boolean => option.value.id === id )?.value ?? null
        this.model.update( (current: RegisteredMovementFormModel): RegisteredMovementFormModel => ({
            ...current,
            vehicles: current.vehicles.map( (item: MovementVehicleModel, position: number): MovementVehicleModel => position === index ? { ...item, driver } : item ),
        }) )
    }

    protected vehicleWarning (vehicle: VehicleModel): string | undefined {
        return this.warningOf( 'vehicle', vehicle.status.value )
    }

    private warningOf (kind: 'participant' | 'vehicle', status: PresenceStatusEnum | undefined): string | undefined {
        return status !== undefined && this.interpretedMovementType().includes( status ) ? this.translateService.translate( `movements.form.warning.${ kind }.${ status }` ) : undefined
    }

    private addVehicle (vehicle: VehicleModel): void {
        this.model.update( (current: RegisteredMovementFormModel): RegisteredMovementFormModel => ({
            ...current,
            vehicles: [ ...current.vehicles, { vehicle: FormModelHelper.copy( vehicle ), driver: null } ],
        }) )
    }

    protected removeVehicle (index: number): void {
        this.model.update( (current: RegisteredMovementFormModel): RegisteredMovementFormModel => ({
            ...current,
            vehicles: current.vehicles.filter( (_: MovementVehicleModel, position: number): boolean => position !== index ),
        }) )
    }

    protected goTo (step: number): void {
        this.activeTab.set( step )
    }

    protected nextFromInformation (): void {
        if (this.isFormValid( this.form.information )) this.goTo( 2 )
    }

    protected nextFromContent (): void {
        if (!this.isFormValid( this.form.content )) return
        if (this.vehicleStep()) this.goTo( 3 )
        else this.submit()
    }

    protected submit (): void {
        if (this.saving() || this.loading()) return
        if (GenericHelper.nonNull( this.idParam ) && !this.movement()) return
        if (!this.sectionsValid()) {
            this.logInvalidForm( this.model() )
            return
        }
        const dto: MovementDto = toRegisteredMovementDto( this.model() )
        const current: MovementModel | undefined = this.movement()
        this.save( current ? this.facade.updateRegisteredMovement( current.id, dto, ETagHelper.ifMatch( current ) ) : this.facade.createRegisteredMovement( dto ) )
    }

    private sectionsValid (): boolean {
        return [ this.isFormValid( this.form.information ), this.isFormValid( this.form.content ), this.isFormValid( this.form.vehicles ) ].every( Boolean )
    }

    protected get idParam (): string | undefined {
        return this.route.snapshot.params['movementId']
    }
}
