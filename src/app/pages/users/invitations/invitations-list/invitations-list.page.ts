import { Component, computed, Signal} from '@angular/core'
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms'
import {TranslocoPipe} from '@jsverse/transloco'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'
import {ListComponent} from '@shared/ui/common/list/list.component'
import {DatePicker} from 'primeng/datepicker'
import {Button} from 'primeng/button'
import {
    ProjectProfileElementComponent,
} from '@shared/ui/domain/project-profile-element/project-profile-element.component'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {StringHelper} from '@shared/helpers/string.helper'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {RouterLink} from '@angular/router'

@Component({
    selector: 'app-invitations-list',
    imports: [
        TranslocoPipe,
        FormsModule,
        InputTextModule,
        ToggleButtonModule,
        ReactiveFormsModule,
        ListComponent,
        DatePicker,
        Button,
        ProjectProfileElementComponent,
        RegistryTemplateDirective,
        RouterLink,
    ],
    templateUrl: './invitations-list.page.html',
})
export class InvitationsListPage extends GenericListComponent {
    protected readonly hasFilters: Signal<boolean> = computed((): boolean =>
        StringHelper.isNotNullNorBlank(this.sessionFacade.userProjectProfileInvitationsPageTextSearchParam())
        || GenericHelper.nonNull(this.sessionFacade.userProjectProfileInvitationsPageDateTimeSearchParam()),
    )

    public constructor() {
        super()

        this.form = this.initForm()

        this.sessionFacade.fetchProjectProfileInvitationPage(undefined, undefined)
    }

    protected initForm(): FormGroup {
        return this.formBuilder.group({
            textSearched: this.formBuilder.control(this.sessionFacade.userProjectProfileInvitationsPageTextSearchParam()),
            dateTimeSearched: this.formBuilder.control(this.sessionFacade.userProjectProfileInvitationsPageDateTimeSearchParam()),
        })
    }

    protected loadPage(pageEvent: PageEventModel): void {
        this.sessionFacade.inputInvitationsPageSearchParameters(this.textSearched.value, this.dateTimeSearched.value)
        this.sessionFacade.fetchProjectProfileInvitationPage(pageEvent.pageNumber, pageEvent.pageSize)
    }

    protected get textSearched(): FormControl {
        return this.form.get('textSearched') as FormControl
    }

    protected get dateTimeSearched(): FormControl {
        return this.form.get('dateTimeSearched') as FormControl
    }
}
