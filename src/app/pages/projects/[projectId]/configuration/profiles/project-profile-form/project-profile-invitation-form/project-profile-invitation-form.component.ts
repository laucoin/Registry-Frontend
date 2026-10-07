import { ChangeDetectionStrategy,Component, OnDestroy} from '@angular/core'
import {CardModule} from 'primeng/card'
import {DividerModule} from 'primeng/divider'
import {InputTextModule} from 'primeng/inputtext'
import {PaginatorModule} from 'primeng/paginator'
import {TranslatePipe} from '@ngx-translate/core'
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms'
import {ProjectProfilesDto} from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profiles.dto'
import {FormFieldErrorComponent} from '@shared/ui/form-field-error/form-field-error.component'
import {FormComponent} from '@shared/ui/form/form.component'
import {GenericProjectProfileFormComponent} from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/generic-project-profile-form.component'
import {RegistryRequiredDirective} from '@shared/directives/registry-required.directive'
import {SelectModule} from 'primeng/select'
import {Button} from 'primeng/button'
import {TreeTableModule} from 'primeng/treetable'
import {TableModule} from 'primeng/table'
import {
    SelectElementsFieldComponent,
} from '@shared/ui/select-elements-field/select-elements-field.component'
import {PluralTranslationPipe} from '@shared/helpers/pipe/plural-translation.pipe'
import {FormUtil} from '@shared/helpers/util/form.util'
import {DateFormatPipe} from '@shared/helpers/pipe/date-format.pipe'
import {UserUtil} from '@shared/helpers/util/user.util'
import {DateTimeFieldComponent} from '@shared/ui/date-time-field/date-time-field.component'
import {UserModel} from '@shared/models/model/user.model'
import {RegistryValidators} from '@shared/helpers/util/registry.validator'

@Component({
	changeDetection: ChangeDetectionStrategy.Eager,
    selector: 'app-project-profile-invitation-form',
    imports: [
        CardModule,
        DividerModule,
        InputTextModule,
        PaginatorModule,
        TranslatePipe,
        ReactiveFormsModule,
        FormFieldErrorComponent,
        FormComponent,
        RegistryRequiredDirective,
        SelectModule,
        Button,
        TreeTableModule,
        TableModule,
        SelectElementsFieldComponent,
        PluralTranslationPipe,
        DateFormatPipe,
        DateTimeFieldComponent,
    ],
    templateUrl: './project-profile-invitation-form.component.html',
})
export class ProjectProfileInvitationFormComponent extends GenericProjectProfileFormComponent implements OnDestroy {
    protected readonly UserUtil: typeof UserUtil = UserUtil

    public constructor() {
        super()
    }

    protected initForm(): FormGroup {
        return this.formBuilder.group({
            role: this.formBuilder.control(undefined, Validators.required),
            beginDateTime: this.formBuilder.control(undefined, [RegistryValidators.dateRequiredForTime()]),
            endDateTime: this.formBuilder.control(undefined, [RegistryValidators.dateRequiredForTime()]),
            users: this.formBuilder.control([], [Validators.required]),
        }, {
            validators: [RegistryValidators.beginDateBeforeEndDate('beginDateTime', 'endDateTime')],
        })
    }

    protected fillForm(): void {
        // do nothing
    }

    protected submit(): void {
        if (!FormUtil.isFormValid(this.form)) {
            this.logInvalidForm(this.form.value)
            return
        }

        if (this.saving()) return

        this.save(this.facade.createProjectProfiles(this.buildDto()))
    }

    protected buildDto(): ProjectProfilesDto {
        return {
            userIds: this.users.value.map((user: UserModel): string => user.id),
            role: this.role.value,
            startAccess: this.beginDateTime.value,
            endAccess: this.endDateTime.value,
        }
    }

    protected handleSearch(searched: string | undefined): void {
        this.facade.searchUsers(searched)
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }

    protected get users(): FormControl {
        return this.form.get('users') as FormControl
    }
}
