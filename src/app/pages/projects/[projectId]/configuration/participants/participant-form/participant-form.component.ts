import { Component, computed, inject, input, InputSignal, OnDestroy, Signal, signal, WritableSignal} from '@angular/core'
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
import {Button} from 'primeng/button'
import {CardModule} from 'primeng/card'
import {DividerModule} from 'primeng/divider'
import {FormComponent} from '@shared/ui/common/form/form.component'
import {FieldErrorComponent} from '@shared/ui/common/field-error/field-error.component'
import {InputTextModule} from 'primeng/inputtext'
import {TranslocoPipe} from '@jsverse/transloco'
import {ParticipantModel} from '@shared/models/model/participant.model'
import {RegistryRequiredDirective} from '@shared/directives/registry-required.directive'
import {DatePicker} from 'primeng/datepicker'
import {AutoComplete, AutoCompleteCompleteEvent} from 'primeng/autocomplete'
import {SelectItem} from 'primeng/api'
import {GroupModel} from '@shared/models/model/group.model'
import {
    SelectElementsFieldComponent,
} from '@shared/ui/common/select-elements-field/select-elements-field.component'
import {GroupHelper} from '@shared/helpers/group.helper'
import {ProjectModel} from '@shared/models/model/project.model'
import {DateFormatPipe} from '@shared/helpers/pipe/date-format.pipe'
import {ParticipantDto} from '@pages/projects/[projectId]/configuration/participants/data/dto/participant.dto'
import {FormModelHelper, SelectableItem} from '@shared/helpers/form/form-model.helper'
import {BaseFormComponent} from '@shared/ui/base/base-form.component'
import {withLoading} from '@shared/helpers/rx.helper'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {FormTitlePipe} from '@shared/helpers/pipe/form-title.pipe'
import {FormButtonPipe} from '@shared/helpers/pipe/form-button.pipe'
import {DateTimeFieldComponent} from '@shared/ui/common/date-time-field/date-time-field.component'
import {PluralTranslationPipe} from '@shared/helpers/pipe/plural-translation.pipe'
import {FormIconPipe} from '@shared/helpers/pipe/form-icon.pipe'

/**
 * Purpose: Form fields of a participant.
 * Scope: Builds the participant fields shared by creation and edition.
 * Limits: Does not submit; the participant page does.
 */
@Component({
    selector: 'app-participant-form',
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
        DatePicker,
        AutoComplete,
        SelectElementsFieldComponent,
        DateFormatPipe,
        FormTitlePipe,
        FormButtonPipe,
        DateTimeFieldComponent,
        PluralTranslationPipe,
        FormIconPipe,

    ],
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

    protected readonly userOptions: Signal<SelectableItem<UserModel>[]> = computed(
        (): SelectableItem<UserModel>[] => FormModelHelper.selectable( this.facade.searchedUsersMetadata() ),
    )
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
        this.contextProject.set(participant?.project || this.sessionFacade.selectedProject())
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
        this.save(editing ? this.facade.updateParticipant(this.participant()!.id, dto) : this.facade.createParticipant(dto), this.redirect())
    }

    protected handleUserSearch(searched: AutoCompleteCompleteEvent): void {
        this.facade.searchUsers(searched.query)
    }

    protected handleGroupSearch(searched: AutoCompleteCompleteEvent): void {
        this.facade.searchGroups(searched.query)
    }

    protected handleUserSelection(selected: SelectItem<UserModel> | null | undefined): void {
        const user: SelectItem<UserModel> | null = selected ?? null
        this.rememberNames(user)
        this.model.update((current: ParticipantFormModel): ParticipantFormModel => withSelectedUser(current, user, {
            firstName: this.previousFirstName(),
            lastName: this.previousLastName(),
        }))
    }

    private rememberNames(user: SelectItem<UserModel> | null): void {
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
