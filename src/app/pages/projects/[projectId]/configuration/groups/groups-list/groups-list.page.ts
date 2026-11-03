import { NgTemplateOutlet } from '@angular/common'
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive'
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
import { injectSearchQuery, SearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query'
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe'
import { StringHelper } from '@shared/helpers/string.helper'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { ListComponent } from '@shared/ui/common/list/list.component'

const GROUPS_LIST_DEFAULTS: GroupsListSearchModel = toGroupsListSearchModel({ q: undefined, at: undefined, isPresent: undefined, isVisible: undefined })
const GROUPS_LIST_QUERY_SCHEMA: SearchQuerySchema<GroupsListSearchModel> = { q: 'text', at: 'date', isPresent: 'choice', isVisible: 'choice' }

/**
 * Purpose: Page listant les groupes du projet sélectionné avec recherche et déclencheur « charger plus ».
 * Scope: Lie le composant de liste à la facade des groupes, possède le formulaire de recherche et donne à la liste le template de ligne d'un groupe.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
    selector: 'app-groups-list',
    imports: [
        IfProjectAuthorityDirective,
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
    protected readonly hiddenAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_RESTORE

    protected readonly facade: GroupFacade = inject(GroupFacade)
    private readonly sessionFacade: SessionFacade = inject(SessionFacade)

    protected readonly createRoute: GroupRoutesEnum = GroupRoutesEnum.CREATE

    protected readonly canCreate: Signal<boolean> = computed((): boolean => CurrentUserHelper.hasProjectAuthority(
        this.sessionFacade.currentUser(),
        this.facade.selectedProjectId(),
        ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_C,
    ))

    protected readonly activeFilters: Signal<number> = computed((): number => [
        StringHelper.isNotNullNorBlank(this.facade.groupsPageQueryParam()),
        this.facade.groupsPageAtParam() !== undefined,
        this.facade.groupsPageIsPresentParam() !== undefined,
        this.facade.groupsPageIsVisibleParam() !== undefined,
    ].filter(Boolean).length)

    protected readonly model: WritableSignal<GroupsListSearchModel> = signal(GROUPS_LIST_DEFAULTS)
    protected readonly form: FieldTree<GroupsListSearchModel> = createSearchForm(this.model)
    private readonly searchQuery: SearchQuery = injectSearchQuery({
        schema: GROUPS_LIST_QUERY_SCHEMA,
        defaults: GROUPS_LIST_DEFAULTS,
        model: this.model,
        apply: (model: GroupsListSearchModel): void => {
            this.inputSearch(model)
            this.facade.fetchGroupsPage(undefined, undefined)
        },
    })

    protected search(): void {
        this.inputSearch(this.model())
        this.facade.fetchGroupsPage(0, undefined)
        this.searchQuery.write()
    }

    protected resetFilters(): void {
        this.model.set(GROUPS_LIST_DEFAULTS)
        this.search()
    }

    private inputSearch(model: GroupsListSearchModel): void {
        const search: ReturnType<typeof toGroupsListSearchParams> = toGroupsListSearchParams(model)
        this.facade.inputPageSearchParameters(search.q, search.at, search.isPresent, search.isVisible)
    }

    protected loadBatch(pageEvent: PageEventModel): void {
        this.facade.fetchGroupsPage(pageEvent.page, pageEvent.size)
    }
}
