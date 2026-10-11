import { NgTemplateOutlet } from '@angular/common'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, Signal, WritableSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { RouterLink } from '@angular/router'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { SessionFacade } from '@core/registry/state/session.facade'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/icon'
import '@sgdf/ui/input'
import '@sgdf/ui/option'
import '@sgdf/ui/page-title'
import '@sgdf/ui/select'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { GroupRoutesEnum } from '@pages/projects/[projectId]/configuration/groups/group-routes.enum'
import { GroupRowComponent } from '@pages/projects/[projectId]/configuration/groups/group-row/group-row.component'
import {
    GroupsListSearchModel,
    toGroupsListSearchModel,
    toGroupsListSearchParams,
} from '@pages/projects/[projectId]/configuration/groups/groups-list/groups-list.search'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe'
import { StringHelper } from '@shared/helpers/string.helper'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { ListComponent } from '@shared/ui/common/list/list.component'

/**
 * Purpose: Page listing the groups of the selected project with search and a "load more" trigger.
 * Scope: Binds the list component to the group facade, owns the search form and gives the list the row template of a group.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-groups-list',
    imports: [
        ListComponent,
        GroupRowComponent,
        RegistryTemplateDirective,
        SgdfFieldDirective,
        TranslocoPipe,
        FormField,
        RouterLink,
        BooleanChoicePipe,
        NgTemplateOutlet,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './groups-list.page.html',
})
export class GroupsListPage {
    protected readonly facade: GroupFacade = inject(GroupFacade)
    private readonly sessionFacade: SessionFacade = inject(SessionFacade)

    protected readonly createRoute: GroupRoutesEnum = GroupRoutesEnum.CREATE

    protected readonly canCreate: Signal<boolean> = computed((): boolean => CurrentUserHelper.hasProjectAuthority(
        this.sessionFacade.currentUser(),
        this.facade.selectedProjectId(),
        ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_C,
    ))

    protected readonly activeFilters: Signal<number> = computed((): number => [
        StringHelper.isNotNullNorBlank(this.facade.groupsPageTextSearchedParam()),
        this.facade.groupsPageDateTimeSearchedParam() !== undefined,
        this.facade.groupsPagePresenceSearchedParam() !== undefined,
        this.facade.groupsPageVisibilitySearchedParam() !== undefined,
    ].filter(Boolean).length)

    protected readonly model: WritableSignal<GroupsListSearchModel> = signal(toGroupsListSearchModel({
        textSearched: this.facade.groupsPageTextSearchedParam(),
        dateTimeSearched: this.facade.groupsPageDateTimeSearchedParam(),
        presenceSearched: this.facade.groupsPagePresenceSearchedParam(),
        visibilitySearched: this.facade.groupsPageVisibilitySearchedParam(),
    }))
    protected readonly form: FieldTree<GroupsListSearchModel> = createSearchForm(this.model)

    public constructor() {
        this.facade.fetchGroupsPage(undefined, undefined)
    }

    protected search(): void {
        const search: ReturnType<typeof toGroupsListSearchParams> = toGroupsListSearchParams(this.model())
        this.facade.inputPageSearchParameters(search.textSearched, search.dateTimeSearched, search.presenceSearched, search.visibilitySearched)
        this.facade.fetchGroupsPage(0, undefined)
    }

    protected resetFilters(): void {
        this.model.set({ textSearched: '', dateTimeSearched: null, presenceSearched: '', visibilitySearched: '' })
        this.search()
    }

    protected loadBatch(pageEvent: PageEventModel): void {
        this.facade.fetchGroupsPage(pageEvent.pageNumber, pageEvent.pageSize)
    }
}
