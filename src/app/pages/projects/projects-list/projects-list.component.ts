import { Component, computed, inject, Signal} from '@angular/core'
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {ProjectFacade} from '@pages/projects/data/state/project/project.facade'
import {ListComponent} from '@shared/ui/list/list.component'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {ProjectElementComponent} from '@pages/projects/project-element/project-element.component'
import {Button} from 'primeng/button'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {TranslatePipe} from '@ngx-translate/core'
import {RouterLink} from '@angular/router'
import {ProjectRoutesEnum} from '@pages/projects/project-routes.enum'
import {Select} from 'primeng/select'
import {DatePicker} from 'primeng/datepicker'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'
import {ToggleSwitch} from 'primeng/toggleswitch'
import {GenericUtil} from '@shared/helpers/util/generic.util'
import {InfoComponent} from '@shared/ui/info/info.component'
import {StringUtil} from '@shared/helpers/util/string.util'

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
        TranslatePipe,
        ReactiveFormsModule,
        RouterLink,
        Select,
        DatePicker,
        ToggleSwitch,
        InfoComponent,
    ],
    templateUrl: './projects-list.component.html',
})
export class ProjectsListComponent extends GenericListComponent {
    protected readonly facade: ProjectFacade = inject(ProjectFacade)

    protected readonly ProjectRoutesEnum: typeof ProjectRoutesEnum = ProjectRoutesEnum

    protected readonly hasFilters: Signal<boolean> = computed((): boolean =>
        StringUtil.isNotNullNorBlank(this.facade.projectsPageTextSearchedParam())
        || GenericUtil.nonNull(this.facade.projectsPageDateTimeSearchedParam())
        || GenericUtil.nonNull(this.facade.projectsPageVisibilitySearchedParam()),
    )

    public constructor() {
        super()

        this.form = this.initForm()

        this.facade.fetchProjectsPage(undefined, undefined, false)
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
        this.facade.fetchProjectsPage(pageEvent.pageNumber, pageEvent.pageSize, false)
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
