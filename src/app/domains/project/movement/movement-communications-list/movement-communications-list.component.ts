import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core'
import { GenericListComponent } from '../../../../shared/util-tool/component/generic-list.component'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { PageEventModel } from '../../../../shared/util-model/model/page-event.model'
import { MovementFacade } from '../data/state/movement.facade'
import { Subscription, tap } from 'rxjs'
import { CommunicationFacade } from '../../communication/data/state/communication.facade'
import { Card } from 'primeng/card'
import { ElementSkeletonComponent } from '../../../../shared/util-ui/element-skeleton/element-skeleton.component'
import { MovementElementComponent } from '../../../../shared/util-ui/movement-element/movement-element.component'
import { ListComponent } from '../../../../shared/util-ui/list/list.component'
import { RegistryTemplateDirective } from '../../../../shared/util-tool/directive/registry-template.directive'
import { DatePicker } from 'primeng/datepicker'
import { Button } from 'primeng/button'
import { InputText } from 'primeng/inputtext'
import { Select } from 'primeng/select'
import { TranslatePipe } from '@ngx-translate/core'
import {
  CommunicationElementComponent,
} from '../../communication/communication-element/communication-element.component'

@Component( {
    selector: 'app-movement-communications-list',
    standalone: true,
    imports: [
        Card,
        ElementSkeletonComponent,
        MovementElementComponent,
        ListComponent,
        RegistryTemplateDirective,
        ReactiveFormsModule,
        DatePicker,
        Button,
        InputText,
        Select,
        TranslatePipe,
        CommunicationElementComponent,
    ],
    templateUrl: './movement-communications-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class MovementCommunicationsListComponent extends GenericListComponent implements OnDestroy {
    protected readonly facade: MovementFacade = inject( MovementFacade )
    protected readonly communicationFacade: CommunicationFacade = inject( CommunicationFacade )

    private readonly subscriptions: Subscription = new Subscription()

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()
        this.handleCommunicationActions()
    }

    protected override initForm (): FormGroup {
        return this.formBuilder.group( {
            textSearched: this.formBuilder.control( this.facade.movementCommunicationsPageTextSearchedParam() ),
            visibilitySearched: this.formBuilder.control( this.facade.movementCommunicationsPageVisibilitySearchedParam() ),
            startDateTimeSearched: this.formBuilder.control( this.facade.movementCommunicationsPageStartDateTimeSearchedParam() ),
            endDateTimeSearched: this.formBuilder.control( this.facade.movementCommunicationsPageEndDateTimeSearchedParam() ),
        } )
    }

    protected loadData (): void {
        const id: string | undefined = this.route.snapshot.params['movementId']
        this.facade.fetchMovement( id! )
        this.facade.fetchMovementCommunicationsPage( id!, undefined, undefined, false )
    }

    private handleCommunicationActions (): void {
        this.subscriptions.add(
            this.communicationFacade.handleCommunicationFirstPageReload().pipe(
                tap( (): void => {
                    this.facade.fetchMovementCommunicationsPage(
                        this.route.snapshot.params['movementId'],
                        undefined,
                        undefined,
                        true,
                    )
                } ),
            ).subscribe(),
        )

        this.subscriptions.add(
            this.communicationFacade.handleCommunicationCurrentPageReload().pipe(
                tap( (): void => {
                    this.facade.fetchMovementCommunicationsPage(
                        this.route.snapshot.params['movementId'],
                        this.facade.movementCommunicationsPage()?.pageNumber,
                        this.facade.movementCommunicationsPage()?.pageSize,
                        true,
                    )
                } ),
            ).subscribe(),
        )
    }

    protected override loadPage (pageEvent: PageEventModel): void {
        this.facade.inputMovementCommunicationsPageSearchParameters(
            this.textSearched.value,
            this.visibilitySearched.value,
            this.startDateTimeSearched.value,
            this.endDateTimeSearched.value,
        )
        this.facade.fetchMovementCommunicationsPage(
            this.facade.movement()!.id, pageEvent.pageNumber, pageEvent.pageSize, false,
        )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected get textSearched (): FormControl {
        return this.form.get( 'textSearched' ) as FormControl
    }

    protected get visibilitySearched (): FormControl {
        return this.form.get( 'visibilitySearched' ) as FormControl
    }

    protected get startDateTimeSearched (): FormControl {
        return this.form.get( 'startDateTimeSearched' ) as FormControl
    }

    protected get endDateTimeSearched (): FormControl {
        return this.form.get( 'endDateTimeSearched' ) as FormControl
    }
}
