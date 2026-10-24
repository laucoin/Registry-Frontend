import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, Signal, WritableSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { RouterOutlet } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/avatar'
import '@sgdf/ui/button'
import '@sgdf/ui/copy-button'
import '@sgdf/ui/icon'
import '@sgdf/ui/input'
import '@sgdf/ui/list-item'
import '@sgdf/ui/option'
import '@sgdf/ui/page-title'
import '@sgdf/ui/relative-time'
import '@sgdf/ui/select'
import '@sgdf/ui/tag'
import { UserFacade } from '@pages/users/data/state/user.facade'
import { UserActions } from '@pages/users/users-list/user-actions.service'
import { toUsersListSearchModel, toUsersListSearchParams, UsersListSearchModel } from '@pages/users/users-list/users-list.search'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe'
import { VisibilityNamePipe } from '@shared/helpers/pipe/visibility.pipe'
import { StringHelper } from '@shared/helpers/string.helper'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { UserModel } from '@shared/models/model/user.model'
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component'
import { ListComponent } from '@shared/ui/common/list/list.component'
import { EllipsisDirective } from '@shared/directives/ellipsis.directive'

const INITIALS_LENGTH: number = 2

/**
 * Purpose: Page listing the users with search and a "load more" trigger.
 * Scope: Binds the list component to the user facade and owns the search form; the commands on a user are delegated to UserActions.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-users-list',
    imports: [
        EllipsisDirective,
        ListComponent,
        RegistryTemplateDirective,
        SgdfFieldDirective,
        ElementActionsComponent,
        TranslocoPipe,
        FormField,
        BooleanChoicePipe,
        VisibilityNamePipe,
        RouterOutlet,
    ],
    providers: [UserActions],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './users-list.page.html',
})
export class UsersListPage {
    protected readonly facade: UserFacade = inject(UserFacade)
    protected readonly userActions: UserActions = inject(UserActions)

    protected readonly activeFilters: Signal<number> = computed((): number => [
        StringHelper.isNotNullNorBlank(this.facade.usersPageQueryParam()),
        this.facade.actualUsersPageIsVisibleParam() !== undefined,
    ].filter(Boolean).length)

    protected readonly model: WritableSignal<UsersListSearchModel> = signal(toUsersListSearchModel({
        q: this.facade.usersPageQueryParam(),
        isVisible: this.facade.actualUsersPageIsVisibleParam(),
    }))
    protected readonly form: FieldTree<UsersListSearchModel> = createSearchForm(this.model)

    public constructor() {
        this.facade.fetchUsersPage(undefined, undefined)
    }

    protected search(): void {
        const search: ReturnType<typeof toUsersListSearchParams> = toUsersListSearchParams(this.model())
        this.facade.inputPageSearchParameters(search.q, search.isVisible)
        this.facade.fetchUsersPage(0, undefined)
    }

    protected resetFilters(): void {
        this.model.set({ q: '', isVisible: '' })
        this.search()
    }

    protected loadBatch(pageEvent: PageEventModel): void {
        this.facade.fetchUsersPage(pageEvent.page, pageEvent.size)
    }

    protected fullName(user: UserModel): string {
        return [user.firstName, user.lastName?.toUpperCase()].filter(Boolean).join(' ') || user.email
    }

    protected initials(user: UserModel): string {
        const letters: string = [user.firstName, user.lastName].map((name: string | undefined): string => name?.charAt(0) ?? '').join('')
        return (letters || user.email.charAt(0)).slice(0, INITIALS_LENGTH).toUpperCase()
    }
}
