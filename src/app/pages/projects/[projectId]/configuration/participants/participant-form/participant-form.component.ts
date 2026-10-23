import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, OnDestroy, output, OutputEmitterRef, Signal, signal, WritableSignal } from '@angular/core'
import {ParticipantFacade} from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { FieldTree, FormField } from '@angular/forms/signals'
import {
    createParticipantForm,
    ParticipantFormModel,
    toParticipantDto,
    toParticipantFormModel,
    withSelectedUser,
} from '@pages/projects/[projectId]/configuration/participants/participant-form/participant.form'
import {CustomDatetimeModel} from '@shared/models/model/custom-datetime.model'
import {UserModel} from '@shared/models/model/user.model'
import {FormComponent} from '@shared/ui/common/form/form.component'
import {TranslocoPipe} from '@jsverse/transloco'
import '@sgdf/ui/card'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/divider'
import '@sgdf/ui/input'
import '@sgdf/ui/option'
import '@sgdf/ui/select'
import { FieldErrorDirective } from '@shared/directives/field-error.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { FormActionsComponent } from '@shared/ui/common/form-actions/form-actions.component'
import {ParticipantModel} from '@shared/models/model/participant.model'
import {SelectOptionModel} from '@shared/models/model/select-option.model'
import {GroupModel} from '@shared/models/model/group.model'
import {
    SelectElementsFieldComponent,
} from '@shared/ui/common/select-elements-field/select-elements-field.component'
import {GroupHelper} from '@shared/helpers/group.helper'
import {ProjectModel} from '@shared/models/model/project.model'
import {ParticipantDto} from '@pages/projects/[projectId]/configuration/participants/data/dto/participant.dto'
import {EventHelper} from '@shared/helpers/event.helper'
import {BaseFormComponent} from '@shared/ui/base/base-form.component'
import {withLoading} from '@shared/helpers/rx.helper'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {FormTitlePipe} from '@shared/helpers/pipe/form-title.pipe'
import {FormButtonPipe} from '@shared/helpers/pipe/form-button.pipe'
import {PluralTranslationPipe} from '@shared/helpers/pipe/plural-translation.pipe'
import { ETagHelper } from '@shared/helpers/etag.helper'

/**
 * Purpose: Form fields of a participant.
 * Scope: Builds the participant fields shared by creation and edition.
 * Limits: Does not submit; the participant page does.
 */
@Component({
    selector: 'app-participant-form',
    imports: [
        FormComponent,
        FormActionsComponent,
        FieldErrorDirective,
        SgdfFieldDirective,
        TranslocoPipe,
        FormField,
        SelectElementsFieldComponent,
        FormTitlePipe,
        FormButtonPipe,
        PluralTranslationPipe,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './participant-form.component.html',
})
export class ParticipantFormComponent extends BaseFormComponent implements OnDestroy {
    protected readonly facade: ParticipantFacade = inject(ParticipantFacade)

    protected readonly GroupHelper: typeof GroupHelper = GroupHelper

    protected readonly participant: WritableSignal<ParticipantModel | undefined> = signal(undefined)
    protected readonly contextProject: WritableSignal<ProjectModel | undefined> = signal(undefined)
    protected readonly model: WritableSignal<ParticipantFormModel> = signal(toParticipantFormModel())
    protected readonly form: FieldTree<ParticipantFormModel> = createParticipantForm(this.model, {
        project: this.contextProject,
        formatDate: (date: CustomDatetimeModel): string | undefined => this.datePipe.transform(date),
    })

    public readonly redirect: InputSignal<boolean> = input(true)
    public readonly showTitle: InputSignal<boolean> = input(true)
    public readonly defaultGroup: InputSignal<GroupModel | undefined> = input()
    public readonly cancelled: OutputEmitterRef<void> = output<void>()

    protected readonly userChoices: Signal<SelectOptionModel<UserModel>[]> = computed((): SelectOptionModel<UserModel>[] => {
        const searched: SelectOptionModel<UserModel>[] = this.facade.searchedUsersMetadata()
        const chosen: SelectOptionModel<UserModel> | null = this.model().user
        return chosen && !searched.some( (option: SelectOptionModel<UserModel>): boolean => option.value.id === chosen.value.id ) ? [ chosen, ...searched ] : searched
    })
    protected readonly previousFirstName: WritableSignal<string | undefined> = signal(undefined)
    protected readonly previousLastName: WritableSignal<string | undefined> = signal(undefined)

    public constructor() {
        super()

        this.loadData()

        this.handleLoadedElement()
    }

    protected override loadData(): void {
        if (GenericHelper.nonNull(this.idParam)) {
            this.subscriptions.add(
                this.facade.fetchParticipant(this.idParam!).pipe(
                    withLoading(this.loading),
                ).subscribe( (participant: ParticipantModel): void => {
                    this.participant.set(participant)
                    this.applyParticipant(participant)
                } ),
            )
        }
    }

    protected handleLoadedElement(): void {
        if (!GenericHelper.nonNull(this.idParam)) {
            this.applyParticipant(undefined)
        }
    }

    private applyParticipant(participant: ParticipantModel | undefined): void {
        this.contextProject.set( this.sessionFacade.selectedProject() )
        if (!participant) return
        this.model.set(toParticipantFormModel(participant))
        if (participant.user) this.handleUserSelection(this.model().user)
    }

    protected submit(): void {
        if (this.saving() || this.loading()) return

        const editing: boolean = GenericHelper.nonNull(this.idParam)
        if (editing && !this.participant()) return

        if (!this.isFormValid(this.form)) {
            this.logInvalidForm(this.model())
            return
        }

        const dto: ParticipantDto = toParticipantDto(this.model(), this.defaultGroup())
        this.save(editing ? this.facade.updateParticipant(this.participant()!.id, dto, ETagHelper.ifMatch(this.participant())) : this.facade.createParticipant(dto), this.redirect())
    }

    protected cancel(): void {
        if (this.redirect()) this.navigateToRedirectUri()
        else this.cancelled.emit()
    }

    protected handleUserSearch(query: string): void {
        this.facade.searchUsers(query)
    }

    protected handleUserChoice(event: Event): void {
        const id: string = EventHelper.valueOf( event )
        this.handleUserSelection(this.userChoices().find( (option: SelectOptionModel<UserModel>): boolean => option.value.id === id ))
    }

    protected handleGroupSearch(searched: { query: string }): void {
        this.facade.searchGroups(searched.query)
    }

    protected handleUserSelection(selected: SelectOptionModel<UserModel> | null | undefined): void {
        const user: SelectOptionModel<UserModel> | null = selected ?? null
        this.rememberNames(user)
        this.model.update((current: ParticipantFormModel): ParticipantFormModel => withSelectedUser(current, user, {
            firstName: this.previousFirstName(),
            lastName: this.previousLastName(),
        }))
    }

    private rememberNames(user: SelectOptionModel<UserModel> | null): void {
        if (user?.value.firstName) this.previousFirstName.set(this.model().firstName)
        if (user?.value.lastName) this.previousLastName.set(this.model().lastName)
    }

    protected get idParam(): string | undefined {
        return this.route.snapshot.params['participantId']
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }
}
