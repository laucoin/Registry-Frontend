import { Component, inject } from '@angular/core'
import { GroupRoutesEnum } from '@pages/projects/[projectId]/configuration/groups/group-routes.enum'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { Button } from 'primeng/button'
import { DatePicker } from 'primeng/datepicker'
import { InputText } from 'primeng/inputtext'
import { ListComponent } from '@shared/ui/common/list/list.component'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { TranslatePipe } from '@ngx-translate/core'
import { RouterLink } from '@angular/router'
import { GroupElementComponent } from '@pages/projects/[projectId]/configuration/groups/group-element/group-element.component'
import { Select } from 'primeng/select'
import { GenericListComponent } from '@shared/ui/base/generic-list.component'

@Component( {
    selector: 'app-groups-list',
    imports: [
        Button,
        DatePicker,
        InputText,
        ListComponent,
        ReactiveFormsModule,
        RegistryTemplateDirective,
        TranslatePipe,
        RouterLink,
        GroupElementComponent,
        Select,
    ],
    templateUrl: './groups-list.page.html',
} )
export class GroupsListPage extends GenericListComponent {
    protected readonly facade: GroupFacade = inject( GroupFacade )

    protected readonly GroupRoutesEnum: typeof GroupRoutesEnum = GroupRoutesEnum

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            textSearched: this.formBuilder.control( this.facade.groupsPageTextSearchedParam() ),
            dateTimeSearched: this.formBuilder.control( this.facade.groupsPageDateTimeSearchedParam() ),
            presenceSearched: this.formBuilder.control( this.facade.groupsPagePresenceSearchedParam() ),
            visibilitySearched: this.formBuilder.control( this.facade.groupsPageVisibilitySearchedParam() ),
        } )
    }

    protected loadData (): void {
        this.facade.fetchGroupsPage( undefined, undefined)
    }

    protected loadPage (pageEvent: PageEventModel): void {
        this.facade.inputPageSearchParameters(
            this.textSearched.value,
            this.dateTimeSearched.value,
            this.presenceSearched.value,
            this.visibilitySearched.value,
        )
        this.facade.fetchGroupsPage( pageEvent.pageNumber, pageEvent.pageSize)
    }

    protected get textSearched (): FormControl {
        return this.form.get( 'textSearched' ) as FormControl
    }

    protected get dateTimeSearched (): FormControl {
        return this.form.get( 'dateTimeSearched' ) as FormControl
    }

    protected get presenceSearched (): FormControl {
        return this.form.get( 'presenceSearched' ) as FormControl
    }

    protected get visibilitySearched (): FormControl {
        return this.form.get( 'visibilitySearched' ) as FormControl
    }
}
