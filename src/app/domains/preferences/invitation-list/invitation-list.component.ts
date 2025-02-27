import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { Button } from 'primeng/button'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import {
    EventProfileElementComponent,
} from '../../../shared/util-ui/event-profile-element/event-profile-element.component'
import { InputTextModule } from 'primeng/inputtext'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { DatePicker } from 'primeng/datepicker'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'

@Component( {
    selector: 'app-invitation-list',
    standalone: true,
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        Button,
        TranslateModule,
        EventProfileElementComponent,
        FormsModule,
        InputTextModule,
        ToggleButtonModule,
        ReactiveFormsModule,
        DatePicker,
    ],
    templateUrl: './invitation-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class InvitationListComponent extends GenericListComponent {
    public constructor () {
        super()

        this.form = this.initForm()

        this.registryFacade.fetchEventProfileInvitationPage( undefined, undefined, false )
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            textSearched: this.formBuilder.control( this.registryFacade.userEventProfileInvitationsPageTextSearchParam() ),
            dateTimeSearched: this.formBuilder.control( this.registryFacade.userEventProfileInvitationsPageDateTimeSearchParam() ),
        } )
    }

    protected loadPage (pageEvent: PageEventModel): void {
        this.registryFacade.inputInvitationsPageSearchParameters( this.textSearched.value, this.dateTimeSearched.value )
        this.registryFacade.fetchEventProfileInvitationPage( pageEvent.pageNumber, pageEvent.pageSize, false )
    }

    protected get textSearched (): FormControl {
        return this.form.get( 'textSearched' ) as FormControl
    }

    protected get dateTimeSearched (): FormControl {
        return this.form.get( 'dateTimeSearched' ) as FormControl
    }
}
