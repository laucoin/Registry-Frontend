import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { TranslateModule } from '@ngx-translate/core'
import { InputTextModule } from 'primeng/inputtext'
import { ToggleButtonModule } from 'primeng/togglebutton'
import {
    EventProfileElementComponent,
} from '../../../shared/util-ui/event-profile-element/event-profile-element.component'
import { Button } from 'primeng/button'
import { DatePicker } from 'primeng/datepicker'
import { ToastMessageOptions } from 'primeng/api'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'
import { MessageComponent } from '../../../shared/util-ui/message/message.component'
import { RouterLink } from '@angular/router'
import { PluralTranslationPipe } from '../../../shared/util-tool/pipe/plural-translation.pipe'

@Component( {
    selector: 'app-profile-list',
    standalone: true,
    imports: [
        ListComponent,
        ReactiveFormsModule,
        RegistryTemplateDirective,
        TranslateModule,
        InputTextModule,
        ToggleButtonModule,
        EventProfileElementComponent,
        Button,
        DatePicker,
        MessageComponent,
        RouterLink,
        PluralTranslationPipe,
    ],
    templateUrl: './profile-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class ProfileListComponent extends GenericListComponent {
    protected readonly message: ToastMessageOptions = {
        severity: 'warn',
        summary: 'event-profiles.notifications.EMPTY_USER_EVENT_PROFILE.title',
        detail: 'event-profiles.notifications.EMPTY_USER_EVENT_PROFILE.message',
    }

    public constructor () {
        super()

        this.form = this.initForm()

        this.registryFacade.fetchEventProfilePage( undefined, undefined, false )
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            textSearched: this.formBuilder.control( this.registryFacade.userEventProfilesPageTextSearchParam() ),
            dateTimeSearched: this.formBuilder.control( this.registryFacade.userEventProfilesPageDateTimeSearchParam() ),
        } )
    }

    protected loadPage (pageEvent: PageEventModel): void {
        this.registryFacade.inputPageSearchParameters( this.textSearched.value, this.dateTimeSearched.value )
        this.registryFacade.fetchEventProfilePage( pageEvent.pageNumber, pageEvent.pageSize, false )
    }

    protected get textSearched (): FormControl {
        return this.form.get( 'textSearched' ) as FormControl
    }

    protected get dateTimeSearched (): FormControl {
        return this.form.get( 'dateTimeSearched' ) as FormControl
    }
}
