import { Component, inject, OnDestroy, signal, WritableSignal } from '@angular/core'
import {ActivityModel} from '@shared/models/model/activity.model'
import {withLoading} from '@shared/helpers/rx.helper'
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {ListComponent} from '@shared/ui/list/list.component'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {TranslatePipe} from '@ngx-translate/core'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {MovementElementComponent} from '@shared/ui/movement-element/movement-element.component'
import {Select, SelectModule} from 'primeng/select'
import {Button} from 'primeng/button'
import {DatePicker} from 'primeng/datepicker'
import {ActivityFacade} from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import {ActivityElementComponent} from '@pages/projects/[projectId]/configuration/activities/activity-element/activity-element.component'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'
import {MovementFacade} from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import {Card} from 'primeng/card'
import {ElementSkeletonComponent} from '@shared/ui/element-skeleton/element-skeleton.component'
import {Subscription, tap} from 'rxjs'

@Component({
    selector: 'app-activity-movements-list',
    templateUrl: './activity-movements-list.page.html',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        ReactiveFormsModule,
        TranslatePipe,
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

    public constructor() {
        super()

        this.form = this.initForm()

        this.loadData()
        this.handleMovementActions()
    }

    protected initForm(): FormGroup {
        return this.formBuilder.group({
            typeSearched: this.formBuilder.control(this.facade.activityMovementsPageTypeSearchedParam()),
            startDateTimeSearched: this.formBuilder.control(this.facade.activityMovementsPageStartDateTimeSearchedParam()),
            endDateTimeSearched: this.formBuilder.control(this.facade.activityMovementsPageEndDateTimeSearchedParam()),
            visibilitySearched: this.formBuilder.control(this.facade.activityMovementsPageVisibilitySearchedParam()),
        })
    }

    protected loadData(): void {
        const id: string | undefined = this.route.snapshot.params['activityId']
        this.subscriptions.add(
            this.facade.fetchActivity(id!).pipe(
                withLoading(this.activityLoading),
            ).subscribe( (activity: ActivityModel): void => this.activity.set(activity) ),
        )
        this.facade.fetchActivityMovementsPage(id!, undefined, undefined, false)
    }

    private handleMovementActions(): void {
        this.subscriptions.add(
            this.movementFacade.handleMovementFirstPageReload().pipe(
                tap((): void => {
                    this.facade.fetchActivityMovementsPage(
                        this.route.snapshot.params['activityId'],
                        undefined,
                        undefined,
                        true,
                    )
                }),
            ).subscribe(),
        )

        this.subscriptions.add(
            this.movementFacade.handleMovementCurrentPageReload().pipe(
                tap((): void => {
                    this.facade.fetchActivityMovementsPage(
                        this.route.snapshot.params['activityId'],
                        this.facade.activityMovementsPage()?.pageNumber,
                        this.facade.activityMovementsPage()?.pageSize,
                        true,
                    )
                }),
            ).subscribe(),
        )
    }

    protected loadPage(pageEvent: PageEventModel): void {
        this.facade.inputMovementsPageSearchParameters(
            this.typeSearched.value,
            this.startDateTimeSearched.value,
            this.endDateTimeSearched.value,
            this.visibilitySearched.value,
        )
        this.facade.fetchActivityMovementsPage(
            this.route.snapshot.params['activityId'], pageEvent.pageNumber, pageEvent.pageSize, false,
        )
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }

    protected get typeSearched(): FormControl {
        return this.form.get('typeSearched') as FormControl
    }

    protected get startDateTimeSearched(): FormControl {
        return this.form.get('startDateTimeSearched') as FormControl
    }

    protected get endDateTimeSearched(): FormControl {
        return this.form.get('endDateTimeSearched') as FormControl
    }

    protected get visibilitySearched(): FormControl {
        return this.form.get('visibilitySearched') as FormControl
    }
}
