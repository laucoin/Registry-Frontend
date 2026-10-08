import { Component, computed, inject, Signal} from '@angular/core'
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {ProjectFacade} from '@pages/projects/data/state/project/project.facade'
import {ListComponent} from '@shared/ui/common/list/list.component'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {ProjectElementComponent} from '@pages/projects/project-element/project-element.component'
import {Button} from 'primeng/button'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {TranslocoPipe} from '@jsverse/transloco'
import {RouterLink} from '@angular/router'
import {ProjectRoutesEnum} from '@pages/projects/project-routes.enum'
import {Select} from 'primeng/select'
import {DatePicker} from 'primeng/datepicker'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'
import {ToggleSwitch} from 'primeng/toggleswitch'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {InfoComponent} from '@shared/ui/common/info/info.component'
import {StringHelper} from '@shared/helpers/string.helper'

/**
 * Purpose: Page listing the projects with search and lazy loading.
 * Scope: Binds the list component to the facade and reloads on command events.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-projects-list',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        ProjectElementComponent,
        Button,
        FormsModule,
        InputTextModule,
        ToggleButtonModule,
        TranslocoPipe,
        ReactiveFormsModule,
        RouterLink,
        Select,
        DatePicker,
        ToggleSwitch,
        InfoComponent,
    ],
    templateUrl: './projects-list.page.html',
})
export class ProjectsListPage extends GenericListComponent {
    protected readonly facade: ProjectFacade = inject(ProjectFacade)

    protected readonly ProjectRoutesEnum: typeof ProjectRoutesEnum = ProjectRoutesEnum

    protected readonly hasFilters: Signal<boolean> = computed((): boolean =>
        StringHelper.isNotNullNorBlank(this.facade.projectsPageTextSearchedParam())
        || GenericHelper.nonNull(this.facade.projectsPageDateTimeSearchedParam())
        || GenericHelper.nonNull(this.facade.projectsPageVisibilitySearchedParam()),
    )

    public constructor() {
        super()

        this.form = this.initForm()

        this.facade.fetchProjectsPage(undefined, undefined)
    }

    protected initForm(): FormGroup {
        return this.formBuilder.group({
            textSearched: this.formBuilder.control(this.facade.projectsPageTextSearchedParam()),
            dateTimeSearched: this.formBuilder.control(this.facade.projectsPageDateTimeSearchedParam()),
            withProfile: this.formBuilder.control(this.facade.projectsPageWithProfileSearchedParam()),
            visibilitySearched: this.formBuilder.control(this.facade.projectsPageVisibilitySearchedParam()),
        })
    }

    protected loadPage(pageEvent: PageEventModel): void {
        this.facade.inputPageSearchParameters(
            this.textSearched.value,
            this.dateTimeSearched.value,
            this.withProfile.value,
            this.visibilitySearched.value,
        )
        this.facade.fetchProjectsPage(pageEvent.pageNumber, pageEvent.pageSize)
    }

    protected get textSearched(): FormControl {
        return this.form.get('textSearched') as FormControl
    }

    protected get dateTimeSearched(): FormControl {
        return this.form.get('dateTimeSearched') as FormControl
    }

    protected get withProfile(): FormControl {
        return this.form.get('withProfile') as FormControl
    }

    protected get visibilitySearched(): FormControl {
        return this.form.get('visibilitySearched') as FormControl
    }
}
