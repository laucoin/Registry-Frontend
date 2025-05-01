import { Component, OnDestroy } from '@angular/core'
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { ProjectProfileDto } from '../../data/dto/project-profile.dto'
import { ProjectProfileModel } from '../../../../../../shared/util-model/model/project-profile.model'
import { FormUtil } from '../../../../../../shared/util-tool/util/form.util'
import { TranslateModule } from '@ngx-translate/core'
import { CardModule } from 'primeng/card'
import { DropdownModule } from 'primeng/dropdown'
import { FormFieldErrorComponent } from '../../../../../../shared/util-ui/form-field-error/form-field-error.component'
import { UserElementComponent } from '../../../../../user/user-element/user-element.component'
import { FormComponent } from '../../../../../../shared/util-ui/form/form.component'
import { GenericProjectProfileFormComponent } from '../generic-project-profile-form.component'
import { RegistryRequiredDirective } from '../../../../../../shared/util-tool/directive/registry-required.directive'
import { Button } from 'primeng/button'
import { Select } from 'primeng/select'
import { map } from 'rxjs'
import { DateFormatPipe } from '../../../../../../shared/util-tool/pipe/date-format.pipe'
import { DateTimeFieldComponent } from '../../../../../../shared/util-ui/date-time-field/date-time-field.component'
import { RegistryValidators } from '../../../../../../shared/util-tool/util/registry.validator'

@Component( {
    selector: 'app-project-profile-edition-form',
    standalone: true,
    imports: [
        TranslateModule,
        CardModule,
        ReactiveFormsModule,
        DropdownModule,
        FormFieldErrorComponent,
        UserElementComponent,
        FormComponent,
        RegistryRequiredDirective,
        Button,
        Select,
        DateFormatPipe,
        DateTimeFieldComponent,
    ],
    templateUrl: './project-profile-edition-form.component.html',
} )
export class ProjectProfileEditionFormComponent extends GenericProjectProfileFormComponent implements OnDestroy {
    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            role: this.formBuilder.control( undefined, Validators.required ),
            beginDateTime: this.formBuilder.control( undefined, [ RegistryValidators.dateRequiredForTime() ] ),
            endDateTime: this.formBuilder.control( undefined, [ RegistryValidators.dateRequiredForTime() ] ),
        }, {
            validators: [ RegistryValidators.beginDateBeforeEndDate( 'beginDateTime', 'endDateTime' ) ],
        } )
    }

    protected fillForm (element: ProjectProfileModel | undefined): void {
        if (!element) return
        this.role.patchValue( element?.role.value )
        this.beginDateTime.patchValue( element?.startAccess )
        this.endDateTime.patchValue( element?.endAccess )
    }

    protected submit (): void {
        if (!FormUtil.isFormValid( this.form )) {
            console.warn( this.invalidFormMessage, this.form.value )
            return
        }

        this.subscriptions.add(
            this.facade.updateProjectProfile( this.facade.projectProfile()!.id!, this.buildDto() ).pipe(
                map( (): void => this.navigateToRedirectUri() ),
            ).subscribe(),
        )
    }

    protected buildDto (): ProjectProfileDto {
        return {
            role: this.role.value,
            startAccess: this.beginDateTime.value,
            endAccess: this.endDateTime.value,
        }
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }
}
