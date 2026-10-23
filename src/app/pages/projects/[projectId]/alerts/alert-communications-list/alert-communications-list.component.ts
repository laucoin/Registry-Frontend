import { Component, inject, input, InputSignal, OnDestroy, OnInit } from '@angular/core'
import { AlertModel } from '@shared/models/model/alert.model'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import { DialogElementComponent } from '@shared/ui/domain/dialog-element/dialog-element.component'
import { CommunicationHelper } from '@shared/helpers/communication.helper'
import { CommunicationModel } from '@shared/models/model/communication.model'
import { CommunicationFormComponent } from '@shared/ui/domain/communication-form/communication-form.component'
import { Subscription, tap } from 'rxjs'
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade'
import {TranslocoPipe} from '@jsverse/transloco'

/**
 * Purpose: List of the communications of an alert.
 * Scope: Loads and displays the communications of one alert with search.
 * Limits: Reads through the alert facade only.
 */
@Component( {
    selector: 'app-alert-communications-list',
    imports: [
        DialogElementComponent,
        CommunicationFormComponent,
        TranslocoPipe,
    ],
    templateUrl: './alert-communications-list.component.html',
    styleUrl: './alert-communications-list.component.css',
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
        this.facade.fetchAlertCommunicationsPage( this.alert().id!, undefined, undefined)
    }

    protected getPreviousAuthorId (index: number): string | undefined {
        if (index <= 0) return undefined
        const previousCommunication: CommunicationModel = this.facade.alertCommunicationsPage()!.content[index - 1]
        return CommunicationHelper.getAuthorId( previousCommunication )
    }

    protected getNextAuthorId (index: number, isLast: boolean): string | undefined {
        if (isLast) return undefined
        const nextCommunication: CommunicationModel = this.facade.alertCommunicationsPage()!.content[index + 1]
        return CommunicationHelper.getAuthorId( nextCommunication )
    }

    private handleCommunicationActions (): void {
        this.subscriptions.add(
            this.communicationFacade.handleCommunicationFirstPageReload().pipe(
                tap( (): void => {
                    this.facade.fetchAlertCommunicationsPage(
                        this.alert().id,
                        undefined,
                        undefined)
                } ),
            ).subscribe(),
        )

        this.subscriptions.add(
            this.communicationFacade.handleCommunicationCurrentPageReload().pipe(
                tap( (): void => {
                    this.facade.fetchAlertCommunicationsPage(
                        this.alert().id,
                        this.facade.alertCommunicationsPage()?.pageNumber,
                        this.facade.alertCommunicationsPage()?.pageSize)
                } ),
            ).subscribe(),
        )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }
}
