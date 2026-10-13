import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnDestroy, signal, Signal, WritableSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { ActivatedRoute } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/icon'
import '@sgdf/ui/list-item'
import '@sgdf/ui/option'
import '@sgdf/ui/page-title'
import '@sgdf/ui/select'
import '@sgdf/ui/skeleton'
import { Subscription, tap } from 'rxjs'
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import {
    ActivityMovementsListSearchModel,
    toActivityMovementsListSearchModel,
    toActivityMovementsListSearchParams,
} from '@pages/projects/[projectId]/configuration/activities/activity-movements-list/activity-movements-list.search'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { ProjectEyebrowDirective } from '@shared/directives/project-eyebrow.directive'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe'
import { withLoading } from '@shared/helpers/rx.helper'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { ActivityModel } from '@shared/models/model/activity.model'
import { ListComponent } from '@shared/ui/common/list/list.component'
import { MovementElementComponent } from '@shared/ui/domain/movement-element/movement-element.component'

/**
 * Purpose: Page listing the movements of one activity with search and a "load more" trigger.
 * Scope: Binds the list component to the activity facade, owns the search form, shows the name of the activity and reloads when a movement changes.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-activity-movements-list',
    imports: [
        ProjectEyebrowDirective,
        ListComponent,
        MovementElementComponent,
        RegistryTemplateDirective,
        SgdfFieldDirective,
        BooleanChoicePipe,
        TranslocoPipe,
        FormField,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './activity-movements-list.page.html',
})
export class ActivityMovementsListPage implements OnDestroy {
    protected readonly facade: ActivityFacade = inject(ActivityFacade)
    protected readonly movementFacade: MovementFacade = inject(MovementFacade)
    private readonly route: ActivatedRoute = inject(ActivatedRoute)

    private readonly subscriptions: Subscription = new Subscription()

    protected readonly entity: WritableSignal<ActivityModel | undefined> = signal(undefined)
    protected readonly entityLoading: WritableSignal<boolean> = signal(false)

    protected readonly title: Signal<string> = computed((): string => {
        const entity: ActivityModel | undefined = this.entity()
        return entity ? entity.name : ''
    })

    protected readonly activeFilters: Signal<number> = computed((): number => [
        this.facade.activityMovementsPageTypeSearchedParam() !== undefined,
        this.facade.activityMovementsPageStartDateTimeSearchedParam() !== undefined,
        this.facade.activityMovementsPageEndDateTimeSearchedParam() !== undefined,
        this.facade.activityMovementsPageVisibilitySearchedParam() !== undefined,
    ].filter(Boolean).length)

    protected readonly model: WritableSignal<ActivityMovementsListSearchModel> = signal(toActivityMovementsListSearchModel({
        type: this.facade.activityMovementsPageTypeSearchedParam(),
        from: this.facade.activityMovementsPageStartDateTimeSearchedParam(),
        to: this.facade.activityMovementsPageEndDateTimeSearchedParam(),
        isVisible: this.facade.activityMovementsPageVisibilitySearchedParam(),
    }))
    protected readonly form: FieldTree<ActivityMovementsListSearchModel> = createSearchForm(this.model)

    public constructor() {
        this.loadData()
        this.handleMovementActions()
    }

    protected loadData(): void {
        this.subscriptions.add(
            this.facade.fetchActivity(this.id()).pipe(
                withLoading(this.entityLoading),
            ).subscribe((entity: ActivityModel): void => this.entity.set(entity)),
        )
        this.facade.fetchActivityMovementsPage(this.id(), undefined, undefined)
    }

    private handleMovementActions(): void {
        this.subscriptions.add(
            this.movementFacade.handleMovementFirstPageReload().pipe(
                tap((): void => this.facade.fetchActivityMovementsPage(this.id(), 0, undefined)),
            ).subscribe(),
        )
        this.subscriptions.add(
            this.movementFacade.handleMovementCurrentPageReload().pipe(
                tap((): void => this.facade.reloadActivityMovementsPage(this.id())),
            ).subscribe(),
        )
    }

    protected search(): void {
        const search: ReturnType<typeof toActivityMovementsListSearchParams> = toActivityMovementsListSearchParams(this.model())
        this.facade.inputMovementsPageSearchParameters(
            search.type,
            search.from,
            search.to,
            search.isVisible,
        )
        this.facade.fetchActivityMovementsPage(this.id(), 0, undefined)
    }

    protected resetFilters(): void {
        this.model.set({ type: '', from: null, to: null, isVisible: '' })
        this.search()
    }

    protected loadBatch(pageEvent: PageEventModel): void {
        this.facade.fetchActivityMovementsPage(this.id(), pageEvent.page, pageEvent.size)
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }

    private id(): string {
        return this.route.snapshot.params['activityId']
    }
}
