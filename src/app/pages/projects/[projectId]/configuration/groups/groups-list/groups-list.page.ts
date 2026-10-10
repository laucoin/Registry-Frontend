import { FieldTree, FormField } from '@angular/forms/signals'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { GroupsListSearchModel, toGroupsListSearchModel, toGroupsListSearchParams } from './groups-list.search'
import { Component, inject, signal, WritableSignal } from '@angular/core'
import { GroupRoutesEnum } from '@pages/projects/[projectId]/configuration/groups/group-routes.enum'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { Button } from 'primeng/button'
import { DatePicker } from 'primeng/datepicker'
import { InputText } from 'primeng/inputtext'
import { ListComponent } from '@shared/ui/common/list/list.component'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import {TranslocoPipe} from '@jsverse/transloco'
import { RouterLink } from '@angular/router'
import { GroupElementComponent } from '@pages/projects/[projectId]/configuration/groups/group-element/group-element.component'
import { Select } from 'primeng/select'
import { GenericListComponent } from '@shared/ui/base/generic-list.component'

/**
 * Purpose: Page listing the groups with search and lazy loading.
 * Scope: Binds the list component to the facade and reloads on command events.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component( {
    selector: 'app-groups-list',
    imports: [
        Button,
        DatePicker,
        InputText,
        ListComponent,
        FormField,
        RegistryTemplateDirective,
        TranslocoPipe,
        RouterLink,
        GroupElementComponent,
        Select,
    ],
    templateUrl: './groups-list.page.html',
} )
export class GroupsListPage extends GenericListComponent {
    protected readonly facade: GroupFacade = inject( GroupFacade )

    protected readonly GroupRoutesEnum: typeof GroupRoutesEnum = GroupRoutesEnum

    protected readonly model: WritableSignal<GroupsListSearchModel> = signal( toGroupsListSearchModel( {
        textSearched: this.facade.groupsPageTextSearchedParam(),
        dateTimeSearched: this.facade.groupsPageDateTimeSearchedParam(),
        presenceSearched: this.facade.groupsPagePresenceSearchedParam(),
        visibilitySearched: this.facade.groupsPageVisibilitySearchedParam(),
    } ) )
    protected readonly form: FieldTree<GroupsListSearchModel> = createSearchForm( this.model )

    public constructor () {
        super()

        this.loadData()
    }

    protected loadData (): void {
        this.facade.fetchGroupsPage( undefined, undefined)
    }

    protected loadPage (pageEvent: PageEventModel): void {
        const search: ReturnType<typeof toGroupsListSearchParams> = toGroupsListSearchParams( this.model() )
        this.facade.inputPageSearchParameters(
            search.textSearched,
            search.dateTimeSearched,
            search.presenceSearched,
            search.visibilitySearched,
        )
        this.facade.fetchGroupsPage( pageEvent.pageNumber, pageEvent.pageSize)
    }

}
