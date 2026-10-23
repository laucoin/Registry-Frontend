import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Component, inject, input, InputSignal, OnInit, DestroyRef } from '@angular/core'
import { AlertModel } from '@shared/models/model/alert.model'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import { DialogElementComponent } from '@shared/ui/domain/dialog-element/dialog-element.component'
import { CommunicationHelper } from '@shared/helpers/communication.helper'
import { Observable, tap } from 'rxjs'
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade'
import {TranslocoPipe} from '@jsverse/transloco'

/**
 * Purpose: List of the communications of an alert.
 * Scope: Loads the communications of one alert and reloads them when a communication changes.
 * Limits: Reads through the alert and communication facades only.
 */
@Component( {
    selector: 'app-alert-communications-list',
    imports: [
        DialogElementComponent,
        TranslocoPipe,
    ],
    templateUrl: './alert-communications-list.component.html',
    styleUrl: './alert-communications-list.component.css',
} )
export class AlertCommunicationsListComponent implements OnInit {
    private readonly destroyRef: DestroyRef = inject( DestroyRef )
    protected readonly facade: AlertFacade = inject( AlertFacade )
    protected readonly communicationFacade: CommunicationFacade = inject( CommunicationFacade )

    public readonly alert: InputSignal<AlertModel> = input.required()

    public ngOnInit (): void {
        this.loadData()
        this.handleCommunicationActions()
    }

    protected loadData (): void {
        this.facade.fetchAlertCommunicationsPage( this.alert().id!, undefined, undefined)
    }

    protected getPreviousAuthorId (index: number): string | undefined {
        return CommunicationHelper.previousAuthorId( this.facade.alertCommunicationsPage()?.content, index )
    }

    protected getNextAuthorId (index: number): string | undefined {
        return CommunicationHelper.nextAuthorId( this.facade.alertCommunicationsPage()?.content, index )
    }

    private handleCommunicationActions (): void {
        this.reloadFirstPageOn( this.communicationFacade.handleCommunicationFirstPageReload() )
        this.reloadCurrentPageOn( this.communicationFacade.handleCommunicationCurrentPageReload() )
    }

    private reloadFirstPageOn (events: Observable<unknown>): void {
        events.pipe(
            tap( (): void => this.facade.fetchAlertCommunicationsPage( this.alert().id, undefined, undefined ) ),
        ).pipe( takeUntilDestroyed( this.destroyRef ) ).subscribe()
    }

    private reloadCurrentPageOn (events: Observable<unknown>): void {
        events.pipe(
            tap( (): void => this.facade.fetchAlertCommunicationsPage(
                this.alert().id,
                this.facade.alertCommunicationsPage()?.page,
                this.facade.alertCommunicationsPage()?.size,
            ) ),
        ).pipe( takeUntilDestroyed( this.destroyRef ) ).subscribe()
    }
}
