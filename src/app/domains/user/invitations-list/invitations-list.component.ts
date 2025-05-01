import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { InputTextModule } from 'primeng/inputtext'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import { DatePicker } from 'primeng/datepicker'
import { Button } from 'primeng/button'
import {
    ProjectProfileElementComponent,
} from '../../../shared/util-ui/project-profile-element/project-profile-element.component'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'

@Component( {
    selector: 'app-invitations-list',
    standalone: true,
    imports: [
        TranslateModule,
        FormsModule,
        InputTextModule,
        ToggleButtonModule,
        ReactiveFormsModule,
        ListComponent,
        DatePicker,
        Button,
        ProjectProfileElementComponent,
        RegistryTemplateDirective,
    ],
    templateUrl: './invitations-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class InvitationsListComponent extends GenericListComponent {
    public constructor () {
        super()

        this.form = this.initForm()

        this.registryFacade.fetchProjectProfileInvitationPage( undefined, undefined, false )
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            textSearched: this.formBuilder.control( this.registryFacade.userProjectProfileInvitationsPageTextSearchParam() ),
            dateTimeSearched: this.formBuilder.control( this.registryFacade.userProjectProfileInvitationsPageDateTimeSearchParam() ),
        } )
    }

    protected loadPage (pageEvent: PageEventModel): void {
        this.registryFacade.inputInvitationsPageSearchParameters( this.textSearched.value, this.dateTimeSearched.value )
        this.registryFacade.fetchProjectProfileInvitationPage( pageEvent.pageNumber, pageEvent.pageSize, false )
    }

    protected get textSearched (): FormControl {
        return this.form.get( 'textSearched' ) as FormControl
    }

    protected get dateTimeSearched (): FormControl {
        return this.form.get( 'dateTimeSearched' ) as FormControl
    }
}
