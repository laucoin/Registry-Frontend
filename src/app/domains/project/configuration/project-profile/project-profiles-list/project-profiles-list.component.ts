import {ChangeDetectionStrategy, Component, inject} from '@angular/core'
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms'
import {PageEventModel} from '../../../../../shared/util-model/model/page-event.model'
import {ProjectProfileFacade} from '../data/state/project-profile.facade'
import {ListComponent} from '../../../../../shared/util-ui/list/list.component'
import {RegistryTemplateDirective} from '../../../../../shared/util-tool/directive/registry-template.directive'
import {TranslatePipe} from '@ngx-translate/core'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {
    ProjectProfileElementComponent,
} from '../../../../../shared/util-ui/project-profile-element/project-profile-element.component'
import {RouterLink} from '@angular/router'
import {ProjectProfileRoutesEnum} from '../project-profile-routes.enum'
import {Select, SelectModule} from 'primeng/select'
import {Button} from 'primeng/button'
import {DatePicker} from 'primeng/datepicker'
import {GenericListComponent} from '../../../../../shared/util-tool/component/generic-list.component'

@Component({
    selector: 'app-project-profiles-list',
    standalone: true,
    templateUrl: './project-profiles-list.component.html',
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
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectProfilesListComponent extends GenericListComponent {
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
        this.facade.fetchProjectProfilesPage(undefined, undefined, false)
    }

    protected loadPage(pageEvent: PageEventModel): void {
        this.facade.inputPageSearchParameters(
            this.textSearched.value,
            this.dateTimeSearched.value,
            this.statusSearched.value,
            this.availabilitySearched.value,
        )
        this.facade.fetchProjectProfilesPage(pageEvent.pageNumber, pageEvent.pageSize, false)
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
