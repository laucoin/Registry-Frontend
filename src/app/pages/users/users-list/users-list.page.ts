import { FieldTree, FormField } from '@angular/forms/signals'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { UsersListSearchModel, toUsersListSearchModel, toUsersListSearchParams } from './users-list.search'
import { Component, inject, signal, WritableSignal } from '@angular/core'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {UserFacade} from '@pages/users/data/state/user.facade'
import {ListComponent} from '@shared/ui/common/list/list.component'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {TranslocoPipe} from '@jsverse/transloco'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {Button} from 'primeng/button'
import {UserElementComponent} from '@pages/users/user-element/user-element.component'
import {Select} from 'primeng/select'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'

/**
 * Purpose: Page listing the users with search and lazy loading.
 * Scope: Binds the list component to the facade and reloads on command events.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-users-list',
    imports: [
        ListComponent,
        FormField,
        RegistryTemplateDirective,
        TranslocoPipe,
        InputTextModule,
        ToggleButtonModule,
        Button,
        UserElementComponent,
        Select,
    ],
    templateUrl: './users-list.page.html',
})
export class UsersListPage extends GenericListComponent {
    protected readonly facade: UserFacade = inject(UserFacade)

    protected readonly model: WritableSignal<UsersListSearchModel> = signal( toUsersListSearchModel( {
        textSearched: this.facade.usersPageTextSearchedParam(),
        visibilitySearched: this.facade.actualUsersPageVisibilitySearchedParam(),
    } ) )
    protected readonly form: FieldTree<UsersListSearchModel> = createSearchForm( this.model )

    public constructor() {
        super()

        this.facade.fetchUsersPage(undefined, undefined)
    }

    protected loadPage(pageEvent: PageEventModel): void {
        const search: ReturnType<typeof toUsersListSearchParams> = toUsersListSearchParams( this.model() )
        this.facade.inputPageSearchParameters(search.textSearched, search.visibilitySearched)
        this.facade.fetchUsersPage(pageEvent.pageNumber, pageEvent.pageSize)
    }

}
