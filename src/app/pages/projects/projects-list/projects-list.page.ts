import { FieldTree, FormField } from '@angular/forms/signals'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { ProjectsListSearchModel, toProjectsListSearchModel, toProjectsListSearchParams } from './projects-list.search'
import { Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core'
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
        InputTextModule,
        ToggleButtonModule,
        TranslocoPipe,
        FormField,
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

    protected readonly model: WritableSignal<ProjectsListSearchModel> = signal( toProjectsListSearchModel( {
        textSearched: this.facade.projectsPageTextSearchedParam(),
        dateTimeSearched: this.facade.projectsPageDateTimeSearchedParam(),
        withProfile: this.facade.projectsPageWithProfileSearchedParam(),
        visibilitySearched: this.facade.projectsPageVisibilitySearchedParam(),
    } ) )
    protected readonly form: FieldTree<ProjectsListSearchModel> = createSearchForm( this.model )

    public constructor() {
        super()

        this.facade.fetchProjectsPage(undefined, undefined)
    }

    protected loadPage(pageEvent: PageEventModel): void {
        const search: ReturnType<typeof toProjectsListSearchParams> = toProjectsListSearchParams( this.model() )
        this.facade.inputPageSearchParameters(
            search.textSearched,
            search.dateTimeSearched,
            search.withProfile ?? false,
            search.visibilitySearched,
        )
        this.facade.fetchProjectsPage(pageEvent.pageNumber, pageEvent.pageSize)
    }

}
