import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { TranslateModule } from '@ngx-translate/core'
import { InputTextModule } from 'primeng/inputtext'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { DropdownModule } from 'primeng/dropdown'
import { MovementElementComponent } from '../../../shared/util-ui/movement-element/movement-element.component'
import { Select } from 'primeng/select'
import { Button } from 'primeng/button'
import { DatePicker } from 'primeng/datepicker'
import { ActivityFacade } from '../data/state/activity.facade'
import { ActivityElementComponent } from '../activity-element/activity-element.component'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'
import { MovementFacade } from '../../movement/data/state/movement.facade'
import { Card } from 'primeng/card'
import { ElementSkeletonComponent } from '../../../shared/util-ui/element-skeleton/element-skeleton.component'
import { Subscription, tap } from 'rxjs'

@Component( {
    selector: 'app-activity-movements-list',
    standalone: true,
    templateUrl: './activity-movements-list.component.html',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        ReactiveFormsModule,
        TranslateModule,
        InputTextModule,
        ToggleButtonModule,
        DropdownModule,
        MovementElementComponent,
        Select,
        Button,
        DatePicker,
        ActivityElementComponent,
        Card,
        ElementSkeletonComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class ActivityMovementsListComponent extends GenericListComponent implements OnDestroy {
    protected readonly facade: ActivityFacade = inject( ActivityFacade )
    protected readonly movementFacade: MovementFacade = inject( MovementFacade )

    private readonly subscriptions: Subscription = new Subscription()

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()
        this.handleMovementActions()
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            typeSearched: this.formBuilder.control( this.facade.activityMovementsPageTypeSearchedParam() ),
            startDateTimeSearched: this.formBuilder.control( this.facade.activityMovementsPageStartDateTimeSearchedParam() ),
            endDateTimeSearched: this.formBuilder.control( this.facade.activityMovementsPageEndDateTimeSearchedParam() ),
            visibilitySearched: this.formBuilder.control( this.facade.activityMovementsPageVisibilitySearchedParam() ),
        } )
    }

    protected loadData (): void {
        const id: string | undefined = this.route.snapshot.params['activityId']
        this.facade.fetchActivity( id! )
        this.facade.fetchActivityMovementsPage( id!, undefined, undefined, false )
    }

    private handleMovementActions (): void {
        this.subscriptions.add(
            this.movementFacade.handleMovementFirstPageReload().pipe(
                tap( (): void => {
                    this.facade.fetchActivityMovementsPage(
                        this.route.snapshot.params['activityId'],
                        undefined,
                        undefined,
                        true,
                    )
                } ),
            ).subscribe(),
        )

        this.subscriptions.add(
            this.movementFacade.handleMovementCurrentPageReload().pipe(
                tap( (): void => {
                    this.facade.fetchActivityMovementsPage(
                        this.route.snapshot.params['activityId'],
                        this.facade.activityMovementsPage()?.pageNumber,
                        this.facade.activityMovementsPage()?.pageSize,
                        true,
                    )
                } ),
            ).subscribe(),
        )
    }

    protected loadPage (pageEvent: PageEventModel): void {
        this.facade.inputMovementsPageSearchParameters(
            this.typeSearched.value,
            this.startDateTimeSearched.value,
            this.endDateTimeSearched.value,
            this.visibilitySearched.value,
        )
        this.facade.fetchActivityMovementsPage(
            this.facade.activity()!.id, pageEvent.pageNumber, pageEvent.pageSize, false,
        )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected get typeSearched (): FormControl {
        return this.form.get( 'typeSearched' ) as FormControl
    }

    protected get startDateTimeSearched (): FormControl {
        return this.form.get( 'startDateTimeSearched' ) as FormControl
    }

    protected get endDateTimeSearched (): FormControl {
        return this.form.get( 'endDateTimeSearched' ) as FormControl
    }

    protected get visibilitySearched (): FormControl {
        return this.form.get( 'visibilitySearched' ) as FormControl
    }
}
