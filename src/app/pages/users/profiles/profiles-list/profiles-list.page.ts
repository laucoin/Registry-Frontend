import { Component, computed, inject, Signal} from '@angular/core'
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
import {ProjectProfileFacade} from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import {Select} from 'primeng/select'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {StringHelper} from '@shared/helpers/string.helper'
import {RouterLink} from '@angular/router'

@Component({
    selector: 'app-profiles-list',
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
        Select,
        RouterLink,

    ],
    templateUrl: './profiles-list.page.html',
})
export class ProfilesListPage extends GenericListComponent {
    protected readonly facade: ProjectProfileFacade = inject(ProjectProfileFacade)

    protected readonly hasFilters: Signal<boolean> = computed((): boolean =>
        StringHelper.isNotNullNorBlank(this.sessionFacade.userProjectProfilesPageTextSearchParam())
        || GenericHelper.nonNull(this.sessionFacade.userProjectProfilesPageDateTimeSearchParam())
        || GenericHelper.nonNull(this.sessionFacade.userProjectProfilesPageAvailabilitySearchParam()),
    )

    public constructor() {
        super()

        this.form = this.initForm()

        this.sessionFacade.fetchProjectProfilesPage(undefined, undefined)
    }

    protected initForm(): FormGroup {
        return this.formBuilder.group({
            textSearched: this.formBuilder.control(this.sessionFacade.userProjectProfilesPageTextSearchParam()),
            dateTimeSearched: this.formBuilder.control(this.sessionFacade.userProjectProfilesPageDateTimeSearchParam()),
            availabilitySearched: this.formBuilder.control(this.sessionFacade.userProjectProfilesPageAvailabilitySearchParam()),
        })
    }

    protected loadPage(pageEvent: PageEventModel): void {
        this.sessionFacade.inputProfilesPageSearchParameters(
            this.textSearched.value,
            this.availabilitySearched.value,
            this.dateTimeSearched.value,
        )
        this.sessionFacade.fetchProjectProfilesPage(pageEvent.pageNumber, pageEvent.pageSize)
    }

    protected get textSearched(): FormControl {
        return this.form.get('textSearched') as FormControl
    }

    protected get dateTimeSearched(): FormControl {
        return this.form.get('dateTimeSearched') as FormControl
    }

    protected get availabilitySearched(): FormControl {
        return this.form.get('availabilitySearched') as FormControl
    }
}
