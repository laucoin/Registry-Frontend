import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, model, ModelSignal, OnDestroy, Signal, signal, WritableSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/card'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/divider'
import '@sgdf/ui/icon'
import '@sgdf/ui/icon-button'
import '@sgdf/ui/input'
import '@sgdf/ui/option'
import '@sgdf/ui/select'
import '@sgdf/ui/step'
import '@sgdf/ui/stepper'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { GuestMovementDto } from '@pages/projects/[projectId]/movements/data/dto/guest-movement.dto'
import {
    contentOfChoice,
    reasonChoices,
    reasonKeyOf,
} from '@pages/projects/[projectId]/movements/movement-form/shared/movement-form.shared'
import {
    createGuestMovementForm,
    emptyGuest,
    emptyGuestMovementFormModel,
    GuestMovementFormModel,
    isArrival,
    MovementGuestModel,
    toGuestMovementDto,
    toGuestMovementFormModel,
    withGuestType,
} from '@pages/projects/[projectId]/movements/movement-form/guest/guest-movement.form'
import { FieldErrorDirective } from '@shared/directives/field-error.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { ETagHelper } from '@shared/helpers/etag.helper'
import { EventHelper } from '@shared/helpers/event.helper'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe'
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { withLoading } from '@shared/helpers/rx.helper'
import { ParticipantHelper } from '@shared/helpers/participant.helper'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { GroupModel } from '@shared/models/model/group.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementReasonModel } from '@shared/models/model/movement-reason.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { SelectOptionGroupModel, SelectOptionModel } from '@shared/models/model/select-option.model'
import { BaseFormComponent } from '@shared/ui/base/base-form.component'
import { FieldErrorComponent } from '@shared/ui/common/field-error/field-error.component'
import { FormComponent } from '@shared/ui/common/form/form.component'
import { SelectElementsFieldComponent } from '@shared/ui/common/select-elements-field/select-elements-field.component'

/**
 * Purpose: Page with the form to create or edit a movement of guests.
 * Scope: Walks through the information and content steps, registers arriving guests or selects leaving ones, submits through the facade and navigates back.
 * Limits: Holds no domain state, never calls the backend and has no vehicle step.
 */
@Component( {
    selector: 'app-guest-movement-form',
    imports: [
        FormComponent,
        FormField,
        FieldErrorComponent,
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
    templateUrl: './guest-movement-form.page.html',
} )
export class GuestMovementFormPage extends BaseFormComponent implements OnDestroy {
    protected readonly facade: MovementFacade = inject( MovementFacade )

    protected readonly now: Date = new Date()
    protected readonly movement: WritableSignal<MovementModel | undefined> = signal( undefined )
    protected readonly contextProject: WritableSignal<ProjectModel | undefined> = signal( undefined )
    protected readonly model: WritableSignal<GuestMovementFormModel> = signal( emptyGuestMovementFormModel( this.now ) )
    protected readonly form: FieldTree<GuestMovementFormModel> = createGuestMovementForm( this.model, {
        project: this.contextProject,
        formatDate: (date: CustomDatetimeModel): string | undefined => this.datePipe.transform( date ),
        editing: (): boolean => GenericHelper.nonNull( this.idParam ),
    } )

    protected readonly activeTab: ModelSignal<number> = model<number>( 1 )

    protected readonly arrival: Signal<boolean> = computed( (): boolean => isArrival( this.model().information ) )
    protected readonly reasonOptions: Signal<MovementReasonModel[]> = computed(
        (): MovementReasonModel[] => reasonChoices( this.facade.searchedReasonAndActivityMetadata(), this.model().content.reason ),
    )
    protected readonly suggestions: Signal<SelectOptionModel<ParticipantModel | GroupModel>[]> = computed(
        (): SelectOptionModel<ParticipantModel | GroupModel>[] => this.facade.searchedParticipantAndGroupMetadata()
            .flatMap( (group: SelectOptionGroupModel<ParticipantModel | GroupModel>): SelectOptionModel<ParticipantModel | GroupModel>[] => group.items )
            .filter( (option: SelectOptionModel<ParticipantModel | GroupModel>): boolean => !('name' in option.value) ),
    )

    protected readonly reasonKeyOf: typeof reasonKeyOf = reasonKeyOf
    protected readonly contentOfChoice: (chosen: ParticipantModel | GroupModel) => MovementContentModel[] = contentOfChoice
    protected readonly identifyContent: (content: MovementContentModel) => string = (content: MovementContentModel): string => content.participant.id
    protected readonly contentLabel: (content: MovementContentModel) => SelectOptionModel<ParticipantModel> =
        (content: MovementContentModel): SelectOptionModel<ParticipantModel> => ParticipantHelper.toSelectItem( content.participant )

    public constructor () {
        super()

        this.loadData()

        this.handleLoadedElement()
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected override loadData (): void {
        if (GenericHelper.nonNull( this.idParam )) {
            this.subscriptions.add(
                this.facade.fetchMovement( this.idParam! ).pipe(
                    withLoading( this.loading ),
                ).subscribe( (movement: MovementModel): void => {
                    this.movement.set( movement )
                    this.applyMovement( movement )
                } ),
            )
        }
    }

    protected handleLoadedElement (): void {
        if (!GenericHelper.nonNull( this.idParam )) this.applyMovement( undefined )
    }

    private applyMovement (movement: MovementModel | undefined): void {
        this.contextProject.set( this.sessionFacade.selectedProject() )
        if (movement) this.model.set( toGuestMovementFormModel( movement ) )
    }

    protected handleTypeChange (event: Event): void {
        this.model.update( (current: GuestMovementFormModel): GuestMovementFormModel => withGuestType( current, EventHelper.valueOf( event ) ) )
    }

    protected handleReasonChoice (event: Event): void {
        const reason: MovementReasonModel | null = this.reasonOptions().find( (option: MovementReasonModel): boolean => reasonKeyOf( option ) === EventHelper.valueOf( event ) ) ?? null
        this.model.update( (current: GuestMovementFormModel): GuestMovementFormModel => ({ ...current, content: { ...current.content, reason } }) )
    }

    protected handleReasonSearch (query: string): void {
        this.facade.searchReasonsAndActivities( query, this.model().information.type, ParticipantTypeEnum.GUEST )
    }

    protected handleGuestsSearch (searched: { query: string }): void {
        this.facade.searchParticipantsAndGroups( ParticipantTypeEnum.GUEST, searched.query )
    }

    protected addGuest (): void {
        this.model.update( (current: GuestMovementFormModel): GuestMovementFormModel => ({
            ...current,
            content: { ...current.content, guests: [ ...current.content.guests, emptyGuest() ] },
        }) )
    }

    protected removeGuest (index: number): void {
        this.model.update( (current: GuestMovementFormModel): GuestMovementFormModel => ({
            ...current,
            content: { ...current.content, guests: current.content.guests.filter( (_: MovementGuestModel, position: number): boolean => position !== index ) },
        }) )
    }

    protected goTo (step: number): void {
        this.activeTab.set( step )
    }

    protected nextFromInformation (): void {
        if (this.isFormValid( this.form.information )) this.goTo( 2 )
    }

    protected submit (): void {
        if (this.saving() || this.loading()) return
        if (GenericHelper.nonNull( this.idParam ) && !this.movement()) return
        if (!this.isFormValid( this.form )) {
            this.logInvalidForm( this.model() )
            return
        }
        const dto: GuestMovementDto = toGuestMovementDto( this.model() )
        const current: MovementModel | undefined = this.movement()
        this.save( current ? this.facade.updateGuestMovement( current.id, dto, ETagHelper.ifMatch( current ) ) : this.facade.createGuestMovement( dto ) )
    }

    protected get idParam (): string | undefined {
        return this.route.snapshot.params['movementId']
    }
}
