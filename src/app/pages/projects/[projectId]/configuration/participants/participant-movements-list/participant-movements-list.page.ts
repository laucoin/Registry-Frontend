import { FieldTree, FormField } from '@angular/forms/signals'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { ParticipantMovementsListSearchModel, toParticipantMovementsListSearchModel, toParticipantMovementsListSearchParams } from './participant-movements-list.search'
import { Component, inject, OnDestroy, signal, WritableSignal } from '@angular/core'
import {ParticipantModel} from '@shared/models/model/participant.model'
import {withLoading} from '@shared/helpers/rx.helper'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {ListComponent} from '@shared/ui/common/list/list.component'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {TranslocoPipe} from '@jsverse/transloco'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {MovementElementComponent} from '@shared/ui/domain/movement-element/movement-element.component'
import {Select, SelectModule} from 'primeng/select'
import {Button} from 'primeng/button'
import {DatePicker} from 'primeng/datepicker'
import {ParticipantFacade} from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import {
    ParticipantElementComponent,
} from '@shared/ui/domain/participant-element/participant-element.component'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'
import {MovementFacade} from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import {Subscription, tap} from 'rxjs'
import {Card} from 'primeng/card'
import {ElementSkeletonComponent} from '@shared/ui/common/element-skeleton/element-skeleton.component'

/**
 * Purpose: Page listing the participant movements with search and lazy loading.
 * Scope: Binds the list component to the facade and reloads on command events.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-participant-movements-list',
    templateUrl: './participant-movements-list.page.html',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        FormField,
        TranslocoPipe,
        InputTextModule,
        ToggleButtonModule,
        SelectModule,
        MovementElementComponent,
        Select,
        Button,
        DatePicker,
        ParticipantElementComponent,
        Card,
        ElementSkeletonComponent,
    ],
})
export class ParticipantMovementsListPage extends GenericListComponent implements OnDestroy {
    protected readonly facade: ParticipantFacade = inject(ParticipantFacade)
    protected readonly movementFacade: MovementFacade = inject(MovementFacade)

    private readonly subscriptions: Subscription = new Subscription()

    protected readonly participant: WritableSignal<ParticipantModel | undefined> = signal(undefined)
    protected readonly participantLoading: WritableSignal<boolean> = signal(false)

    protected readonly model: WritableSignal<ParticipantMovementsListSearchModel> = signal( toParticipantMovementsListSearchModel( {
        typeSearched: this.facade.participantMovementsPageTypeSearchedParam(),
        startDateTimeSearched: this.facade.participantMovementsPageStartDateTimeSearchedParam(),
        endDateTimeSearched: this.facade.participantMovementsPageEndDateTimeSearchedParam(),
        visibilitySearched: this.facade.participantMovementsPageVisibilitySearchedParam(),
    } ) )
    protected readonly form: FieldTree<ParticipantMovementsListSearchModel> = createSearchForm( this.model )

    public constructor() {
        super()

        this.loadData()
        this.handleMovementActions()
    }

    protected loadData(): void {
        const id: string | undefined = this.route.snapshot.params['participantId']
        this.subscriptions.add(
            this.facade.fetchParticipant(id!).pipe(
                withLoading(this.participantLoading),
            ).subscribe( (participant: ParticipantModel): void => this.participant.set(participant) ),
        )
        this.facade.fetchParticipantMovementsPage(id!, undefined, undefined)
    }

    private handleMovementActions(): void {
        this.subscriptions.add(
            this.movementFacade.handleMovementFirstPageReload().pipe(
                tap((): void => {
                    this.facade.fetchParticipantMovementsPage(
                        this.route.snapshot.params['participantId'],
                        undefined,
                        undefined)
                }),
            ).subscribe(),
        )

        this.subscriptions.add(
            this.movementFacade.handleMovementCurrentPageReload().pipe(
                tap((): void => {
                    this.facade.fetchParticipantMovementsPage(
                        this.route.snapshot.params['participantId'],
                        this.facade.participantMovementsPage()?.pageNumber,
                        this.facade.participantMovementsPage()?.pageSize)
                }),
            ).subscribe(),
        )
    }

    protected loadPage(pageEvent: PageEventModel): void {
        const search: ReturnType<typeof toParticipantMovementsListSearchParams> = toParticipantMovementsListSearchParams( this.model() )
        this.facade.inputMovementsPageSearchParameters(
            search.typeSearched,
            search.startDateTimeSearched,
            search.endDateTimeSearched,
            search.visibilitySearched,
        )
        this.facade.fetchParticipantMovementsPage(
            this.route.snapshot.params['participantId'], pageEvent.pageNumber, pageEvent.pageSize)
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }

}
