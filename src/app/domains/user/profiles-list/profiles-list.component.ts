import {ChangeDetectionStrategy, Component, computed, inject, Signal} from '@angular/core'
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms'
import {TranslatePipe} from '@ngx-translate/core'
import {PageEventModel} from '../../../shared/util-model/model/page-event.model'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {GenericListComponent} from '../../../shared/util-tool/component/generic-list.component'
import {ListComponent} from '../../../shared/util-ui/list/list.component'
import {DatePicker} from 'primeng/datepicker'
import {Button} from 'primeng/button'
import {
    ProjectProfileElementComponent,
} from '../../../shared/util-ui/project-profile-element/project-profile-element.component'
import {RegistryTemplateDirective} from '../../../shared/util-tool/directive/registry-template.directive'
import {ProjectProfileFacade} from '../../project/configuration/project-profile/data/state/project-profile.facade'
import {Select} from 'primeng/select'
import {GenericUtil} from '../../../shared/util-tool/util/generic.util'
import {StringUtil} from '../../../shared/util-tool/util/string.util'
import {RouterLink} from '@angular/router'

@Component({
    selector: 'app-profiles-list',
    standalone: true,
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
        Select,
        RouterLink,

    ],
    templateUrl: './profiles-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilesListComponent extends GenericListComponent {
    protected readonly facade: ProjectProfileFacade = inject(ProjectProfileFacade)

    protected readonly hasFilters: Signal<boolean> = computed((): boolean =>
        StringUtil.isNotNullNorBlank(this.registryFacade.userProjectProfilesPageTextSearchParam())
        || GenericUtil.nonNull(this.registryFacade.userProjectProfilesPageDateTimeSearchParam())
        || GenericUtil.nonNull(this.registryFacade.userProjectProfilesPageAvailabilitySearchParam()),
    )

    public constructor() {
        super()

        this.form = this.initForm()

        this.registryFacade.fetchProjectProfilesPage(undefined, undefined, false)
    }

    protected initForm(): FormGroup {
        return this.formBuilder.group({
            textSearched: this.formBuilder.control(this.registryFacade.userProjectProfilesPageTextSearchParam()),
            dateTimeSearched: this.formBuilder.control(this.registryFacade.userProjectProfilesPageDateTimeSearchParam()),
            availabilitySearched: this.formBuilder.control(this.registryFacade.userProjectProfilesPageAvailabilitySearchParam()),
        })
    }

    protected loadPage(pageEvent: PageEventModel): void {
        this.registryFacade.inputProfilesPageSearchParameters(
            this.textSearched.value,
            this.availabilitySearched.value,
            this.dateTimeSearched.value,
        )
        this.registryFacade.fetchProjectProfilesPage(pageEvent.pageNumber, pageEvent.pageSize, false)
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
