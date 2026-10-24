import { NgTemplateOutlet } from '@angular/common'
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, Signal, WritableSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { RouterLink, RouterOutlet } from '@angular/router'
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
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import { ActivityRoutesEnum } from '@pages/projects/[projectId]/configuration/activities/activity-routes.enum'
import { ActivityRowComponent } from '@pages/projects/[projectId]/configuration/activities/activity-row/activity-row.component'
import {
    ActivitiesListSearchModel,
    toActivitiesListSearchModel,
    toActivitiesListSearchParams,
} from '@pages/projects/[projectId]/configuration/activities/activities-list/activities-list.search'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe'
import { StringHelper } from '@shared/helpers/string.helper'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { ListComponent } from '@shared/ui/common/list/list.component'

/**
 * Purpose: Page listant les activités du projet sélectionné avec recherche et déclencheur « charger plus ».
 * Scope: Lie le composant de liste à la facade des groupes, possède le formulaire de recherche et donne à la liste le template de ligne d'une activité.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
    selector: 'app-activities-list',
    imports: [
        IfProjectAuthorityDirective,
        ListComponent,
        ActivityRowComponent,
        RegistryTemplateDirective,
        SgdfFieldDirective,
        TranslocoPipe,
        FormField,
        RouterLink,
        RouterOutlet,
        BooleanChoicePipe,
        NgTemplateOutlet,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './activities-list.page.html',
})
export class ActivitiesListPage {
    protected readonly hiddenAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_D

    protected readonly facade: ActivityFacade = inject(ActivityFacade)
    private readonly sessionFacade: SessionFacade = inject(SessionFacade)

    protected readonly createRoute: ActivityRoutesEnum = ActivityRoutesEnum.CREATE

    protected readonly canCreate: Signal<boolean> = computed((): boolean => CurrentUserHelper.hasProjectAuthority(
        this.sessionFacade.currentUser(),
        this.facade.selectedProjectId(),
        ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_C,
    ))

    protected readonly activeFilters: Signal<number> = computed((): number => [
        StringHelper.isNotNullNorBlank(this.facade.activitiesPageQueryParam()),
        this.facade.activitiesPageAtParam() !== undefined,
        this.facade.activitiesPageIsAvailableParam() !== undefined,
        this.facade.activitiesPageIsVisibleParam() !== undefined,
    ].filter(Boolean).length)

    protected readonly model: WritableSignal<ActivitiesListSearchModel> = signal(toActivitiesListSearchModel({
        q: this.facade.activitiesPageQueryParam(),
        at: this.facade.activitiesPageAtParam(),
        isAvailable: this.facade.activitiesPageIsAvailableParam(),
        isVisible: this.facade.activitiesPageIsVisibleParam(),
    }))
    protected readonly form: FieldTree<ActivitiesListSearchModel> = createSearchForm(this.model)

    public constructor() {
        this.facade.fetchActivitiesPage(undefined, undefined)
    }

    protected search(): void {
        const search: ReturnType<typeof toActivitiesListSearchParams> = toActivitiesListSearchParams(this.model())
        this.facade.inputPageSearchParameters(search.q, search.at, search.isAvailable, search.isVisible)
        this.facade.fetchActivitiesPage(0, undefined)
    }

    protected resetFilters(): void {
        this.model.set({ q: '', at: null, isAvailable: '', isVisible: '' })
        this.search()
    }

    protected loadBatch(pageEvent: PageEventModel): void {
        this.facade.fetchActivitiesPage(pageEvent.page, pageEvent.size)
    }
}
