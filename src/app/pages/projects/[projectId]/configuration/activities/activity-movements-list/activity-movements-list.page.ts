import { FieldTree, FormField } from '@angular/forms/signals'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { ActivityMovementsListSearchModel, toActivityMovementsListSearchModel, toActivityMovementsListSearchParams } from './activity-movements-list.search'
import { Component, inject, OnDestroy, signal, WritableSignal } from '@angular/core'
import {ActivityModel} from '@shared/models/model/activity.model'
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
import {ActivityFacade} from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import {ActivityElementComponent} from '@pages/projects/[projectId]/configuration/activities/activity-element/activity-element.component'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'
import {MovementFacade} from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import {Card} from 'primeng/card'
import {ElementSkeletonComponent} from '@shared/ui/common/element-skeleton/element-skeleton.component'
import {Subscription, tap} from 'rxjs'

/**
 * Purpose: Page listing the activity movements with search and lazy loading.
 * Scope: Binds the list component to the facade and reloads on command events.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-activity-movements-list',
    templateUrl: './activity-movements-list.page.html',
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
        ActivityElementComponent,
        Card,
        ElementSkeletonComponent,
    ],
})
export class ActivityMovementsListPage extends GenericListComponent implements OnDestroy {
    protected readonly facade: ActivityFacade = inject(ActivityFacade)
    protected readonly movementFacade: MovementFacade = inject(MovementFacade)

    private readonly subscriptions: Subscription = new Subscription()

    protected readonly activity: WritableSignal<ActivityModel | undefined> = signal(undefined)
    protected readonly activityLoading: WritableSignal<boolean> = signal(false)

    protected readonly model: WritableSignal<ActivityMovementsListSearchModel> = signal( toActivityMovementsListSearchModel( {
        typeSearched: this.facade.activityMovementsPageTypeSearchedParam(),
        startDateTimeSearched: this.facade.activityMovementsPageStartDateTimeSearchedParam(),
        endDateTimeSearched: this.facade.activityMovementsPageEndDateTimeSearchedParam(),
        visibilitySearched: this.facade.activityMovementsPageVisibilitySearchedParam(),
    } ) )
    protected readonly form: FieldTree<ActivityMovementsListSearchModel> = createSearchForm( this.model )

    public constructor() {
        super()

        this.loadData()
        this.handleMovementActions()
    }

    protected loadData(): void {
        const id: string | undefined = this.route.snapshot.params['activityId']
        this.subscriptions.add(
            this.facade.fetchActivity(id!).pipe(
                withLoading(this.activityLoading),
            ).subscribe( (activity: ActivityModel): void => this.activity.set(activity) ),
        )
        this.facade.fetchActivityMovementsPage(id!, undefined, undefined)
    }

    private handleMovementActions(): void {
        this.subscriptions.add(
            this.movementFacade.handleMovementFirstPageReload().pipe(
                tap((): void => {
                    this.facade.fetchActivityMovementsPage(
                        this.route.snapshot.params['activityId'],
                        undefined,
                        undefined)
                }),
            ).subscribe(),
        )

        this.subscriptions.add(
            this.movementFacade.handleMovementCurrentPageReload().pipe(
                tap((): void => {
                    this.facade.fetchActivityMovementsPage(
                        this.route.snapshot.params['activityId'],
                        this.facade.activityMovementsPage()?.pageNumber,
                        this.facade.activityMovementsPage()?.pageSize)
                }),
            ).subscribe(),
        )
    }

    protected loadPage(pageEvent: PageEventModel): void {
        const search: ReturnType<typeof toActivityMovementsListSearchParams> = toActivityMovementsListSearchParams( this.model() )
        this.facade.inputMovementsPageSearchParameters(
            search.typeSearched,
            search.startDateTimeSearched,
            search.endDateTimeSearched,
            search.visibilitySearched,
        )
        this.facade.fetchActivityMovementsPage(
            this.route.snapshot.params['activityId'], pageEvent.pageNumber, pageEvent.pageSize)
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }

}
