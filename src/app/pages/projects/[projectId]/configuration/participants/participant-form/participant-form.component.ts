import { Component, inject, input, InputSignal, OnDestroy, signal, WritableSignal} from '@angular/core'
import {ParticipantFacade} from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms'
import {RegistryValidators} from '@shared/helpers/registry.validator'
import {ParticipantDto} from '@pages/projects/[projectId]/configuration/participants/data/dto/participant.dto'
import {Button} from 'primeng/button'
import {CardModule} from 'primeng/card'
import {DividerModule} from 'primeng/divider'
import {FormComponent} from '@shared/ui/common/form/form.component'
import {FormFieldErrorComponent} from '@shared/ui/common/form-field-error/form-field-error.component'
import {InputTextModule} from 'primeng/inputtext'
import {TranslocoPipe} from '@jsverse/transloco'
import {FormHelper} from '@shared/helpers/form.helper'
import {ParticipantModel} from '@shared/models/model/participant.model'
import {UserDto} from '@shared/models/dto/user.dto'
import {DateHelper} from '@shared/helpers/date.helper'
import {RegistryRequiredDirective} from '@shared/directives/registry-required.directive'
import {DatePicker} from 'primeng/datepicker'
import {AutoComplete, AutoCompleteCompleteEvent} from 'primeng/autocomplete'
import {SelectItem} from 'primeng/api'
import {UserHelper} from '@shared/helpers/user.helper'
import {GroupModel} from '@shared/models/model/group.model'
import {
    SelectElementsFieldComponent,
} from '@shared/ui/common/select-elements-field/select-elements-field.component'
import {GroupHelper} from '@shared/helpers/group.helper'
import {ProjectModel} from '@shared/models/model/project.model'
import {DateFormatPipe} from '@shared/helpers/pipe/date-format.pipe'
import {GenericFormComponent} from '@shared/ui/base/generic-form.component'
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
        FormFieldErrorComponent,
        FormsModule,
        InputTextModule,
        TranslocoPipe,
        ReactiveFormsModule,
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
export class ParticipantFormComponent extends GenericFormComponent<ParticipantModel, ParticipantDto> implements OnDestroy {
    protected readonly facade: ParticipantFacade = inject(ParticipantFacade)

    protected readonly GroupHelper: typeof GroupHelper = GroupHelper

    protected readonly form: FormGroup
    protected readonly participant: WritableSignal<ParticipantModel | undefined> = signal(undefined)

    public readonly redirect: InputSignal<boolean> = input(true)
    public readonly showTitle: InputSignal<boolean> = input(true)
    public readonly defaultGroup: InputSignal<GroupModel | undefined> = input()

    protected readonly selectedUser: WritableSignal<SelectItem<UserDto> | undefined> = signal(undefined)
    protected readonly previousFirstName: WritableSignal<string | undefined> = signal(undefined)
    protected readonly previousLastName: WritableSignal<string | undefined> = signal(undefined)

    public constructor() {
        super()

        this.form = this.initForm()

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

    protected initForm(): FormGroup {
        return this.formBuilder.group({
            firstName: this.formBuilder.control(
                undefined,
                [Validators.required, Validators.maxLength(150), RegistryValidators.nonBlank()],
            ),
            lastName: this.formBuilder.control(
                undefined,
                [Validators.required, Validators.maxLength(150), RegistryValidators.nonBlank()],
            ),
            birthday: this.formBuilder.control(
                undefined,
                [
                    Validators.required, RegistryValidators.maxDateTime(
                    DateHelper.toCustomDateTime(new Date())!,
                    undefined,
                ),
                ],
            ),
            user: this.formBuilder.control(undefined),
            groups: this.formBuilder.control(undefined),
            beginDateTime: this.formBuilder.control(undefined, [RegistryValidators.dateRequiredForTime()]),
            endDateTime: this.formBuilder.control(undefined, [RegistryValidators.dateRequiredForTime()]),
        }, {
            validators: [RegistryValidators.beginDateBeforeEndDate('beginDateTime', 'endDateTime')],
        })
    }

    protected handleLoadedElement(): void {
        if (!GenericHelper.nonNull(this.idParam)) {
            this.applyParticipant(undefined)
        }
    }

    private applyParticipant(participant: ParticipantModel | undefined): void {
        const contextProject: ProjectModel | undefined = participant?.project || this.sessionFacade.selectedProject()
        this.addProjectDateValidators(contextProject, this.beginDateTime)
        this.addProjectDateValidators(contextProject, this.endDateTime)
        this.fillForm(participant)
    }

    protected fillForm(element: ParticipantModel | undefined): void {
        if (!element) return

        this.firstName.patchValue(element?.firstName)
        this.lastName.patchValue(element?.lastName)
        this.birthday.patchValue(element?.birthday ? new Date(element?.birthday) : undefined)
        if (element?.user) {
            const user: SelectItem<UserDto> = UserHelper.toSelectItem(element.user)
            this.user.patchValue(user)
            this.handleUserSelection(user)
        }
        this.groups.patchValue(element?.groups)
        this.beginDateTime.patchValue(element?.startAvailability)
        this.endDateTime.patchValue(element?.endAvailability)
    }

    protected submit(): void {
        if (this.saving() || this.loading()) return

        const editing: boolean = GenericHelper.nonNull(this.idParam)
        if (editing && !this.participant()) return

        if (!FormHelper.isFormValid(this.form)) {
            this.logInvalidForm(this.form.value)
            return
        }

        const dto: ParticipantDto = this.buildDto()
        this.save(editing ? this.facade.updateParticipant(this.participant()!.id, dto) : this.facade.createParticipant(dto), this.redirect())
    }

    protected buildDto(): ParticipantDto {
        const groupIds: string[] = (this.groups.value ?? []).map((item: GroupModel): string => item.id)
        if (this.defaultGroup() && !groupIds.includes(this.defaultGroup()!.id)) {
            groupIds.push(this.defaultGroup()!.id)
        }
        return {
            firstName: this.firstName.value,
            lastName: this.lastName.value,
            birthday: DateHelper.getDate(this.birthday.value),
            userId: this.selectedUser()?.value.id,
            groupIds: groupIds,
            startAvailability: this.beginDateTime.value,
            endAvailability: this.endDateTime.value,
        }
    }

    protected handleUserSearch(searched: AutoCompleteCompleteEvent): void {
        this.facade.searchUsers(searched.query)
    }

    protected handleGroupSearch(searched: AutoCompleteCompleteEvent): void {
        this.facade.searchGroups(searched.query)
    }

    protected handleUserSelection(selectedUser: SelectItem<UserDto> | undefined): void {
        this.selectedUser.set(selectedUser)

        const user: UserDto | undefined = this.selectedUser()?.value
        if (GenericHelper.nonNull(user)) {
            if (user!.firstName) {
                this.previousFirstName.set(this.firstName.value)
                this.firstName.patchValue(user!.firstName)
                this.firstName.disable()
            }
            if (user!.lastName) {
                this.previousLastName.set(this.lastName.value)
                this.lastName.patchValue(user!.lastName)
                this.lastName.disable()
            }
        } else {
            this.firstName.enable()
            this.firstName.patchValue(this.previousFirstName())
            this.lastName.enable()
            this.lastName.patchValue(this.previousLastName())
        }
    }

    protected get idParam(): string | undefined {
        return this.route.snapshot.params['participantId']
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }

    protected get user(): FormControl {
        return this.form.get('user') as FormControl
    }

    protected get firstName(): FormControl {
        return this.form.get('firstName') as FormControl
    }

    protected get lastName(): FormControl {
        return this.form.get('lastName') as FormControl
    }

    protected get birthday(): FormControl {
        return this.form.get('birthday') as FormControl
    }

    protected get beginDateTime(): FormControl {
        return this.form.get('beginDateTime') as FormControl
    }

    protected get endDateTime(): FormControl {
        return this.form.get('endDateTime') as FormControl
    }

    protected get groups(): FormControl {
        return this.form.get('groups') as FormControl
    }
}
