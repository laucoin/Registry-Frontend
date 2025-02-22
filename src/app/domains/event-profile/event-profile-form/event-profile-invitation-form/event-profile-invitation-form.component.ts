import { Component, signal, Signal } from '@angular/core'
import { CardModule } from 'primeng/card'
import { DividerModule } from 'primeng/divider'
import { InputTextModule } from 'primeng/inputtext'
import { PaginatorModule } from 'primeng/paginator'
import { TranslateModule } from '@ngx-translate/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { EventProfilesDto } from '../../data/dto/event-profiles.dto'
import { FormFieldErrorComponent } from '../../../../shared/util-ui/form-field-error/form-field-error.component'
import { AsyncPipe, DatePipe } from '@angular/common'
import { FormComponent } from '../../../../shared/util-ui/form/form.component'
import { GenericEventProfileFormComponent } from '../generic-event-profile-form.component'
import { RegistryRequiredDirective } from '../../../../shared/util-tool/directive/registry-required.directive'
import { SelectModule } from 'primeng/select'
import { Button } from 'primeng/button'
import { DatePicker } from 'primeng/datepicker'
import { EventProfileFacade } from '../../data/state/event-profile.facade'
import { Observable } from 'rxjs'
import { TreeTableModule } from 'primeng/treetable'
import { TableModule } from 'primeng/table'
import {
    SelectElementsFieldComponent,
} from '../../../../shared/util-ui/select-elements-field/select-elements-field.component'
import { UserDto } from '../../../../shared/util-model/dto/user.dto'
import { SelectItem } from 'primeng/api'
import { DateUtil } from '../../../../shared/util-tool/util/date.util'

@Component( {
    selector: 'app-event-profile-invitation-form',
    standalone: true,
    imports: [
        CardModule,
        DividerModule,
        InputTextModule,
        PaginatorModule,
        TranslateModule,
        ReactiveFormsModule,
        FormFieldErrorComponent,
        AsyncPipe,
        FormComponent,
        RegistryRequiredDirective,
        SelectModule,
        Button,
        DatePicker,
        TreeTableModule,
        TableModule,
        SelectElementsFieldComponent,
        DatePipe,
    ],
    templateUrl: './event-profile-invitation-form.component.html',
} )
export class EventProfileInvitationFormComponent extends GenericEventProfileFormComponent {
    protected readonly usersSuggestion$: Observable<SelectItem<UserDto>[]>

    protected readonly startDateExample: Signal<Date> = signal( DateUtil.startDateExample )
    protected readonly endDateExample: Signal<Date> = signal( DateUtil.endDateExample )

    public constructor (protected override readonly facade: EventProfileFacade) {
        super( facade )

        this.usersSuggestion$ = this.facade.searchedUsersMetadata
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            role: this.formBuilder.control( undefined, Validators.required ),
            range: this.formBuilder.control( undefined ),
            users: this.formBuilder.control( [], [ Validators.required ] ),
        } )
    }

    protected next (): void {
        const profiles: EventProfilesDto = {
            userIds: this.users.value.map( (item: SelectItem<UserDto>): string => item.value.id ),
            role: this.role.value,
            startAccess: this.range.value?.[0],
            endAccess: this.range.value?.[1],
        }

        this.subscriptions.add(
            this.facade.createEventProfiles( profiles ).subscribe( (): void => {
                this.navigateToRedirectUri()
            } ),
        )
    }

    protected handleSearch (searched: string | undefined): void {
        this.facade.searchUsers( searched, this.contextEventId() )
    }

    protected get users (): FormControl {
        return this.form.get( 'users' ) as FormControl
    }
}
