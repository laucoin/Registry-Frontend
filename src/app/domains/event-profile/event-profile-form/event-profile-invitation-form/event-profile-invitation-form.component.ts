import { Component } from '@angular/core'
import { SelectUsersFieldComponent } from '../../../../shared/util-ui/select-users-field/select-users-field.component'
import { CalendarModule } from 'primeng/calendar'
import { CardModule } from 'primeng/card'
import { DividerModule } from 'primeng/divider'
import { InputSwitchModule } from 'primeng/inputswitch'
import { InputTextModule } from 'primeng/inputtext'
import { PaginatorModule } from 'primeng/paginator'
import { TranslateModule } from '@ngx-translate/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { EventProfilesDto } from '../../data/dto/event-profiles.dto'
import { FormFieldErrorComponent } from '../../../../shared/util-ui/form-field-error/form-field-error.component'
import { AsyncPipe } from '@angular/common'
import { FormComponent } from '../../../../shared/util-ui/form/form.component'
import { GenericEventProfileFormComponent } from '../generic-event-profile-form.component'
import { UserDto } from '../../../../shared/util-model/dto/user.dto'

@Component( {
    selector: 'app-event-profile-invitation-form',
    standalone: true,
    imports: [
        SelectUsersFieldComponent,
        CalendarModule,
        CardModule,
        DividerModule,
        InputSwitchModule,
        InputTextModule,
        PaginatorModule,
        TranslateModule,
        ReactiveFormsModule,
        FormFieldErrorComponent,
        AsyncPipe,
        FormComponent,
    ],
    templateUrl: './event-profile-invitation-form.component.html',
    styleUrl: './event-profile-invitation-form.component.scss',
} )
export class EventProfileInvitationFormComponent extends GenericEventProfileFormComponent {
    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            users: this.formBuilder.control( [], [ Validators.required ] ),
            role: this.formBuilder.control( undefined, Validators.required ),
            range: this.formBuilder.control( undefined ),
        } )
    }

    protected next (): void {
        const profiles: EventProfilesDto = {
            userIds: this.users.value.map( (user: UserDto): string => user.id ),
            role: this.role.value,
            startAccess: this.range.value?.[0],
            endAccess: this.range.value?.[1],
        }

        this.subscriptions.add(
            this.facade.createElements( profiles ).subscribe( (): void => {
                this.navigateToRedirectUri()
            } ),
        )
    }

    protected get users (): FormControl {
        return this.form.get( 'users' ) as FormControl
    }
}
