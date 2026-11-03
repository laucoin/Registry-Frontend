import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, Signal, WritableSignal, DestroyRef } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { ActivatedRoute, ParamMap } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/format-duration'
import '@sgdf/ui/format-number'
import '@sgdf/ui/icon'
import '@sgdf/ui/list-item'
import '@sgdf/ui/option'
import '@sgdf/ui/page-title'
import '@sgdf/ui/select'
import '@sgdf/ui/skeleton'
import '@sgdf/ui/stat'
import { distinctUntilChanged, map, tap } from 'rxjs'
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import {
    ActivityMovementsListSearchModel,
    toActivityMovementsListSearchModel,
    toActivityMovementsListSearchParams,
} from '@pages/projects/[projectId]/configuration/activities/activity-movements-list/activity-movements-list.search'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { injectSearchQuery, SearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query'
import { DurationHelper } from '@shared/helpers/duration.helper'
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe'
import { withLoading } from '@shared/helpers/rx.helper'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { ActivityModel } from '@shared/models/model/activity.model'
import { ListComponent } from '@shared/ui/common/list/list.component'
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component'
import { MovementElementComponent } from '@shared/ui/domain/movement-element/movement-element.component'

const ACTIVITY_MOVEMENTS_LIST_DEFAULTS: ActivityMovementsListSearchModel = toActivityMovementsListSearchModel({ type: undefined, from: undefined, to: undefined, isVisible: undefined })
const ACTIVITY_MOVEMENTS_LIST_QUERY_SCHEMA: SearchQuerySchema<ActivityMovementsListSearchModel> = { type: 'text', from: 'date', to: 'date', isVisible: 'choice' }

/**
 * Purpose: Page listant les mouvements d'une activité avec recherche et déclencheur « charger plus ».
 * Scope: Lie le composant de liste à la facade des activités, possède le formulaire de recherche, affiche le nom de l'activité et ses statistiques (participation, temps en sortie et heures homme), et recharge quand un mouvement change.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
    selector: 'app-activity-movements-list',
    imports: [
        IfProjectAuthorityDirective,
        ListComponent,
        SectionErrorComponent,
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
export class ActivityMovementsListPage {
    protected readonly hiddenAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_RESTORE

    private readonly destroyRef: DestroyRef = inject( DestroyRef )
    protected readonly facade: ActivityFacade = inject(ActivityFacade)
    protected readonly movementFacade: MovementFacade = inject(MovementFacade)
    private readonly route: ActivatedRoute = inject(ActivatedRoute)

    protected readonly entity: WritableSignal<ActivityModel | undefined> = signal(undefined)
    protected readonly entityLoading: WritableSignal<boolean> = signal(false)

    protected readonly title: Signal<string> = computed((): string => {
        const entity: ActivityModel | undefined = this.entity()
        return entity ? entity.name : ''
    })

    protected readonly movementDuration: Signal<string | undefined> = computed((): string | undefined => {
        const seconds: number | undefined = this.facade.activityStatistics()?.movementSeconds

        return seconds === undefined ? undefined : DurationHelper.toIsoHours(seconds)
    })

    protected readonly manDuration: Signal<string | undefined> = computed((): string | undefined => {
        const seconds: number | undefined = this.facade.activityStatistics()?.manSeconds

        return seconds === undefined ? undefined : DurationHelper.toIsoHours(seconds)
    })

    protected readonly activeFilters: Signal<number> = computed((): number => [
        this.facade.activityMovementsPageTypeParam() !== undefined,
        this.facade.activityMovementsPageFromParam() !== undefined,
        this.facade.activityMovementsPageToParam() !== undefined,
        this.facade.activityMovementsPageIsVisibleParam() !== undefined,
    ].filter(Boolean).length)

    protected readonly model: WritableSignal<ActivityMovementsListSearchModel> = signal(ACTIVITY_MOVEMENTS_LIST_DEFAULTS)
    protected readonly form: FieldTree<ActivityMovementsListSearchModel> = createSearchForm(this.model)
    private readonly searchQuery: SearchQuery = injectSearchQuery({
        schema: ACTIVITY_MOVEMENTS_LIST_QUERY_SCHEMA,
        defaults: ACTIVITY_MOVEMENTS_LIST_DEFAULTS,
        model: this.model,
        apply: (model: ActivityMovementsListSearchModel, initial: boolean): void => {
            this.inputSearch(model)
            if (!initial) {
                this.facade.fetchActivityMovementsPage(this.id(), undefined, undefined)
            }
        },
    })

    public constructor() {
        this.route.paramMap.pipe(
                map((params: ParamMap): string | null => params.get('activityId')),
                distinctUntilChanged(),
            ).pipe( takeUntilDestroyed( this.destroyRef ) ).subscribe((): void => this.loadData())
        this.handleMovementActions()
    }

    protected loadData(): void {
        this.facade.fetchActivity(this.id()).pipe(
                withLoading(this.entityLoading),
            ).pipe( takeUntilDestroyed( this.destroyRef ) ).subscribe((entity: ActivityModel): void => this.entity.set(entity))
        this.facade.fetchActivityStatistics(this.id())
        this.facade.fetchActivityMovementsPage(this.id(), undefined, undefined)
    }

    private handleMovementActions(): void {
        this.movementFacade.handleMovementFirstPageReload().pipe(
                tap((): void => this.facade.fetchActivityMovementsPage(this.id(), 0, undefined)),
                tap((): void => this.facade.reloadActivityStatistics(this.id())),
            ).pipe( takeUntilDestroyed( this.destroyRef ) ).subscribe()
        this.movementFacade.handleMovementCurrentPageReload().pipe(
                tap((): void => this.facade.reloadActivityMovementsPage(this.id())),
                tap((): void => this.facade.reloadActivityStatistics(this.id())),
            ).pipe( takeUntilDestroyed( this.destroyRef ) ).subscribe()
    }

    protected search(): void {
        this.inputSearch(this.model())
        this.facade.fetchActivityMovementsPage(this.id(), 0, undefined)
        this.searchQuery.write()
    }

    protected resetFilters(): void {
        this.model.set(ACTIVITY_MOVEMENTS_LIST_DEFAULTS)
        this.search()
    }

    private inputSearch(model: ActivityMovementsListSearchModel): void {
        const search: ReturnType<typeof toActivityMovementsListSearchParams> = toActivityMovementsListSearchParams(model)
        this.facade.inputMovementsPageSearchParameters(search.type, search.from, search.to, search.isVisible)
    }

    protected retryStatistics(): void {
        this.facade.fetchActivityStatistics(this.id())
    }

    protected loadBatch(pageEvent: PageEventModel): void {
        this.facade.fetchActivityMovementsPage(this.id(), pageEvent.page, pageEvent.size)
    }

    private id(): string {
        return this.route.snapshot.params['activityId']
    }
}
