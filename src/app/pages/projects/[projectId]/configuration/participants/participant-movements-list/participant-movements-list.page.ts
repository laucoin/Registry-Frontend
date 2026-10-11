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
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import {
    ParticipantMovementsListSearchModel,
    toParticipantMovementsListSearchModel,
    toParticipantMovementsListSearchParams,
} from '@pages/projects/[projectId]/configuration/participants/participant-movements-list/participant-movements-list.search'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe'
import { withLoading } from '@shared/helpers/rx.helper'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { ListComponent } from '@shared/ui/common/list/list.component'
import { MovementElementComponent } from '@shared/ui/domain/movement-element/movement-element.component'

/**
 * Purpose: Page listing the movements of one participant with search and a "load more" trigger.
 * Scope: Binds the list component to the participant facade, owns the search form, shows the name of the participant and reloads when a movement changes.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-participant-movements-list',
    imports: [
        ListComponent,
        MovementElementComponent,
        RegistryTemplateDirective,
        SgdfFieldDirective,
        BooleanChoicePipe,
        TranslocoPipe,
        FormField,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './participant-movements-list.page.html',
})
export class ParticipantMovementsListPage implements OnDestroy {
    protected readonly facade: ParticipantFacade = inject(ParticipantFacade)
    protected readonly movementFacade: MovementFacade = inject(MovementFacade)
    private readonly route: ActivatedRoute = inject(ActivatedRoute)

    private readonly subscriptions: Subscription = new Subscription()

    protected readonly entity: WritableSignal<ParticipantModel | undefined> = signal(undefined)
    protected readonly entityLoading: WritableSignal<boolean> = signal(false)

    protected readonly title: Signal<string> = computed((): string => {
        const entity: ParticipantModel | undefined = this.entity()
        return entity ? [entity.firstName, entity.lastName?.toUpperCase()].filter(Boolean).join(' ') : ''
    })

    protected readonly activeFilters: Signal<number> = computed((): number => [
        this.facade.participantMovementsPageTypeSearchedParam() !== undefined,
        this.facade.participantMovementsPageStartDateTimeSearchedParam() !== undefined,
        this.facade.participantMovementsPageEndDateTimeSearchedParam() !== undefined,
        this.facade.participantMovementsPageVisibilitySearchedParam() !== undefined,
    ].filter(Boolean).length)

    protected readonly model: WritableSignal<ParticipantMovementsListSearchModel> = signal(toParticipantMovementsListSearchModel({
        typeSearched: this.facade.participantMovementsPageTypeSearchedParam(),
        startDateTimeSearched: this.facade.participantMovementsPageStartDateTimeSearchedParam(),
        endDateTimeSearched: this.facade.participantMovementsPageEndDateTimeSearchedParam(),
        visibilitySearched: this.facade.participantMovementsPageVisibilitySearchedParam(),
    }))
    protected readonly form: FieldTree<ParticipantMovementsListSearchModel> = createSearchForm(this.model)

    public constructor() {
        this.loadData()
        this.handleMovementActions()
    }

    protected loadData(): void {
        this.subscriptions.add(
            this.facade.fetchParticipant(this.id()).pipe(
                withLoading(this.entityLoading),
            ).subscribe((entity: ParticipantModel): void => this.entity.set(entity)),
        )
        this.facade.fetchParticipantMovementsPage(this.id(), undefined, undefined)
    }

    private handleMovementActions(): void {
        this.subscriptions.add(
            this.movementFacade.handleMovementFirstPageReload().pipe(
                tap((): void => this.facade.fetchParticipantMovementsPage(this.id(), 0, undefined)),
            ).subscribe(),
        )
        this.subscriptions.add(
            this.movementFacade.handleMovementCurrentPageReload().pipe(
                tap((): void => this.facade.reloadParticipantMovementsPage(this.id())),
            ).subscribe(),
        )
    }

    protected search(): void {
        const search: ReturnType<typeof toParticipantMovementsListSearchParams> = toParticipantMovementsListSearchParams(this.model())
        this.facade.inputMovementsPageSearchParameters(
            search.typeSearched,
            search.startDateTimeSearched,
            search.endDateTimeSearched,
            search.visibilitySearched,
        )
        this.facade.fetchParticipantMovementsPage(this.id(), 0, undefined)
    }

    protected resetFilters(): void {
        this.model.set({ typeSearched: '', startDateTimeSearched: null, endDateTimeSearched: null, visibilitySearched: '' })
        this.search()
    }

    protected loadBatch(pageEvent: PageEventModel): void {
        this.facade.fetchParticipantMovementsPage(this.id(), pageEvent.pageNumber, pageEvent.pageSize)
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }

    private id(): string {
        return this.route.snapshot.params['participantId']
    }
}
