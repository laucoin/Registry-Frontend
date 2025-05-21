import { ChangeDetectionStrategy, Component, inject, input, InputSignal, OnDestroy, OnInit } from '@angular/core'
import { AlertModel } from '../../../../shared/util-model/model/alert.model'
import { AlertFacade } from '../data/state/alert.facade'
import { ReactiveFormsModule } from '@angular/forms'
import { DialogElementComponent } from '../../../../shared/util-ui/dialog-element/dialog-element.component'
import { CommunicationUtil } from '../../../../shared/util-tool/util/communication.util'
import { CommunicationModel } from '../../communication/data/model/communication.model'
import { CommunicationFormComponent } from '../../../../shared/util-ui/communication-form/communication-form.component'
import { Subscription, tap } from 'rxjs'
import { CommunicationFacade } from '../../communication/data/state/communication.facade'
import { TranslatePipe } from '@ngx-translate/core'

@Component( {
    selector: 'app-alert-communications-list',
    standalone: true,
    imports: [
        DialogElementComponent,
        ReactiveFormsModule,
        CommunicationFormComponent,
        TranslatePipe,
    ],
    templateUrl: './alert-communications-list.component.html',
    styleUrl: './alert-communications-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class AlertCommunicationsListComponent implements OnInit, OnDestroy {
    protected readonly facade: AlertFacade = inject( AlertFacade )
    protected readonly communicationFacade: CommunicationFacade = inject( CommunicationFacade )

    protected readonly subscriptions: Subscription = new Subscription()

    public readonly alert: InputSignal<AlertModel> = input.required()

    public ngOnInit (): void {
        this.loadData()
        this.handleCommunicationActions()
    }

    protected loadData (): void {
        this.facade.fetchAlertCommunicationsPage( this.alert().id!, undefined, undefined, true )
    }

    protected getPreviousAuthorId (index: number): string | undefined {
        if (index <= 0) return undefined
        const previousCommunication: CommunicationModel = this.facade.alertCommunicationsPage()!.content[index - 1]
        return CommunicationUtil.getAuthorId( previousCommunication )
    }

    protected getNextAuthorId (index: number, isLast: boolean): string | undefined {
        if (isLast) return undefined
        const nextCommunication: CommunicationModel = this.facade.alertCommunicationsPage()!.content[index + 1]
        return CommunicationUtil.getAuthorId( nextCommunication )
    }

    private handleCommunicationActions (): void {
        this.subscriptions.add(
            this.communicationFacade.handleCommunicationFirstPageReload().pipe(
                tap( (): void => {
                    this.facade.fetchAlertCommunicationsPage(
                        this.alert().id,
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
                    this.facade.fetchAlertCommunicationsPage(
                        this.alert().id,
                        this.facade.alertCommunicationsPage()?.pageNumber,
                        this.facade.alertCommunicationsPage()?.pageSize,
                        true,
                    )
                } ),
            ).subscribe(),
        )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }
}
