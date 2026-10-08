import { Component, inject} from '@angular/core'
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {ProjectProfileFacade} from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import {ListComponent} from '@shared/ui/common/list/list.component'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {TranslatePipe} from '@ngx-translate/core'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {
    ProjectProfileElementComponent,
} from '@shared/ui/domain/project-profile-element/project-profile-element.component'
import {RouterLink} from '@angular/router'
import {ProjectProfileRoutesEnum} from '@pages/projects/[projectId]/configuration/profiles/project-profile-routes.enum'
import {Select, SelectModule} from 'primeng/select'
import {Button} from 'primeng/button'
import {DatePicker} from 'primeng/datepicker'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'

@Component({
    selector: 'app-project-profiles-list',
    templateUrl: './project-profiles-list.page.html',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        ReactiveFormsModule,
        TranslatePipe,
        InputTextModule,
        ToggleButtonModule,
        ProjectProfileElementComponent,
        SelectModule,
        RouterLink,
        Select,
        Button,
        DatePicker,
    ],
})
export class ProjectProfilesListPage extends GenericListComponent {
    protected readonly facade: ProjectProfileFacade = inject(ProjectProfileFacade)

    protected readonly ProjectProfileRoutesEnum: typeof ProjectProfileRoutesEnum = ProjectProfileRoutesEnum

    public constructor() {
        super()

        this.form = this.initForm()

        this.loadData()
    }

    protected initForm(): FormGroup {
        return this.formBuilder.group({
            textSearched: this.formBuilder.control(this.facade.projectProfilesPageTextSearchedParam()),
            dateTimeSearched: this.formBuilder.control(this.facade.projectProfilesPageDateTimeSearchedParam()),
            statusSearched: this.formBuilder.control(this.facade.projectProfilesPageStatusSearchedParam()),
            availabilitySearched: this.formBuilder.control(this.facade.projectProfilesPageAvailabilitySearchedParam()),
        })
    }

    protected loadData(): void {
        this.facade.fetchProjectProfilesPage(undefined, undefined)
    }

    protected loadPage(pageEvent: PageEventModel): void {
        this.facade.inputPageSearchParameters(
            this.textSearched.value,
            this.dateTimeSearched.value,
            this.statusSearched.value,
            this.availabilitySearched.value,
        )
        this.facade.fetchProjectProfilesPage(pageEvent.pageNumber, pageEvent.pageSize)
    }

    protected get textSearched(): FormControl {
        return this.form.get('textSearched') as FormControl
    }

    protected get dateTimeSearched(): FormControl {
        return this.form.get('dateTimeSearched') as FormControl
    }

    protected get statusSearched(): FormControl {
        return this.form.get('statusSearched') as FormControl
    }

    protected get availabilitySearched(): FormControl {
        return this.form.get('availabilitySearched') as FormControl
    }
}
