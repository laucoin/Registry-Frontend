import {ChangeDetectionStrategy, Component, inject, OnDestroy} from '@angular/core'
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms'
import {PageEventModel} from '../../../../../shared/util-model/model/page-event.model'
import {ListComponent} from '../../../../../shared/util-ui/list/list.component'
import {RegistryTemplateDirective} from '../../../../../shared/util-tool/directive/registry-template.directive'
import {TranslatePipe} from '@ngx-translate/core'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {MovementElementComponent} from '../../../../../shared/util-ui/movement-element/movement-element.component'
import {Select, SelectModule} from 'primeng/select'
import {Button} from 'primeng/button'
import {DatePicker} from 'primeng/datepicker'
import {ParticipantFacade} from '../data/state/participant.facade'
import {
    ParticipantElementComponent,
} from '../../../../../shared/util-ui/participant-element/participant-element.component'
import {GenericListComponent} from '../../../../../shared/util-tool/component/generic-list.component'
import {MovementFacade} from '../../../movement/data/state/movement.facade'
import {Subscription, tap} from 'rxjs'
import {Card} from 'primeng/card'
import {ElementSkeletonComponent} from '../../../../../shared/util-ui/element-skeleton/element-skeleton.component'

@Component({
    selector: 'app-participant-movements-list',
    standalone: true,
    templateUrl: './participant-movements-list.component.html',
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
        ParticipantElementComponent,
        Card,
        ElementSkeletonComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantMovementsListComponent extends GenericListComponent implements OnDestroy {
    protected readonly facade: ParticipantFacade = inject(ParticipantFacade)
    protected readonly movementFacade: MovementFacade = inject(MovementFacade)

    private readonly subscriptions: Subscription = new Subscription()

    public constructor() {
        super()

        this.form = this.initForm()

        this.loadData()
        this.handleMovementActions()
    }

    protected initForm(): FormGroup {
        return this.formBuilder.group({
            typeSearched: this.formBuilder.control(this.facade.participantMovementsPageTypeSearchedParam()),
            startDateTimeSearched: this.formBuilder.control(this.facade.participantMovementsPageStartDateTimeSearchedParam()),
            endDateTimeSearched: this.formBuilder.control(this.facade.participantMovementsPageEndDateTimeSearchedParam()),
            visibilitySearched: this.formBuilder.control(this.facade.participantMovementsPageVisibilitySearchedParam()),
        })
    }

    protected loadData(): void {
        const id: string | undefined = this.route.snapshot.params['participantId']
        this.facade.fetchParticipant(id!)
        this.facade.fetchParticipantMovementsPage(id!, undefined, undefined, false)
    }

    private handleMovementActions(): void {
        this.subscriptions.add(
            this.movementFacade.handleMovementFirstPageReload().pipe(
                tap((): void => {
                    this.facade.fetchParticipantMovementsPage(
                        this.route.snapshot.params['participantId'],
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
                    this.facade.fetchParticipantMovementsPage(
                        this.route.snapshot.params['participantId'],
                        this.facade.participantMovementsPage()?.pageNumber,
                        this.facade.participantMovementsPage()?.pageSize,
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
        this.facade.fetchParticipantMovementsPage(
            this.facade.participant()!.id, pageEvent.pageNumber, pageEvent.pageSize, false,
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
