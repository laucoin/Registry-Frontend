import {Component, OnDestroy} from '@angular/core'
import {CardModule} from 'primeng/card'
import {DividerModule} from 'primeng/divider'
import {InputTextModule} from 'primeng/inputtext'
import {PaginatorModule} from 'primeng/paginator'
import {TranslatePipe} from '@ngx-translate/core'
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms'
import {ProjectProfilesDto} from '../../data/dto/project-profiles.dto'
import {FormFieldErrorComponent} from '../../../../../../shared/util-ui/form-field-error/form-field-error.component'
import {FormComponent} from '../../../../../../shared/util-ui/form/form.component'
import {GenericProjectProfileFormComponent} from '../generic-project-profile-form.component'
import {RegistryRequiredDirective} from '../../../../../../shared/util-tool/directive/registry-required.directive'
import {SelectModule} from 'primeng/select'
import {Button} from 'primeng/button'
import {TreeTableModule} from 'primeng/treetable'
import {TableModule} from 'primeng/table'
import {
    SelectElementsFieldComponent,
} from '../../../../../../shared/util-ui/select-elements-field/select-elements-field.component'
import {PluralTranslationPipe} from '../../../../../../shared/util-tool/pipe/plural-translation.pipe'
import {FormUtil} from '../../../../../../shared/util-tool/util/form.util'
import {map} from 'rxjs'
import {DateFormatPipe} from '../../../../../../shared/util-tool/pipe/date-format.pipe'
import {UserUtil} from '../../../../../../shared/util-tool/util/user.util'
import {DateTimeFieldComponent} from '../../../../../../shared/util-ui/date-time-field/date-time-field.component'
import {UserModel} from '../../../../../../shared/util-model/model/user.model'
import {RegistryValidators} from '../../../../../../shared/util-tool/util/registry.validator'

@Component({
    selector: 'app-project-profile-invitation-form',
    standalone: true,
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
            console.warn(this.invalidFormMessage, this.form.value)
            return
        }

        this.subscriptions.add(
            this.facade.createProjectProfiles(this.buildDto()).pipe(
                map((): void => this.navigateToRedirectUri()),
            ).subscribe(),
        )
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
