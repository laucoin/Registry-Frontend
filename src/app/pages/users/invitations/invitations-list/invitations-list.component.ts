import { Component, computed, Signal} from '@angular/core'
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms'
import {TranslatePipe} from '@ngx-translate/core'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'
import {ListComponent} from '@shared/ui/list/list.component'
import {DatePicker} from 'primeng/datepicker'
import {Button} from 'primeng/button'
import {
    ProjectProfileElementComponent,
} from '@shared/ui/project-profile-element/project-profile-element.component'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {StringHelper} from '@shared/helpers/string.helper'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {RouterLink} from '@angular/router'

@Component({
    selector: 'app-invitations-list',
    imports: [
        TranslatePipe,
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
    templateUrl: './invitations-list.component.html',
})
export class InvitationsListComponent extends GenericListComponent {
    protected readonly hasFilters: Signal<boolean> = computed((): boolean =>
        StringHelper.isNotNullNorBlank(this.registryFacade.userProjectProfileInvitationsPageTextSearchParam())
        || GenericHelper.nonNull(this.registryFacade.userProjectProfileInvitationsPageDateTimeSearchParam()),
    )

    public constructor() {
        super()

        this.form = this.initForm()

        this.registryFacade.fetchProjectProfileInvitationPage(undefined, undefined, false)
    }

    protected initForm(): FormGroup {
        return this.formBuilder.group({
            textSearched: this.formBuilder.control(this.registryFacade.userProjectProfileInvitationsPageTextSearchParam()),
            dateTimeSearched: this.formBuilder.control(this.registryFacade.userProjectProfileInvitationsPageDateTimeSearchParam()),
        })
    }

    protected loadPage(pageEvent: PageEventModel): void {
        this.registryFacade.inputInvitationsPageSearchParameters(this.textSearched.value, this.dateTimeSearched.value)
        this.registryFacade.fetchProjectProfileInvitationPage(pageEvent.pageNumber, pageEvent.pageSize, false)
    }

    protected get textSearched(): FormControl {
        return this.form.get('textSearched') as FormControl
    }

    protected get dateTimeSearched(): FormControl {
        return this.form.get('dateTimeSearched') as FormControl
    }
}
