import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Component, inject, input, InputSignal, OnInit, DestroyRef } from '@angular/core'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { Observable, tap } from 'rxjs'
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade'
import {TranslocoPipe} from '@jsverse/transloco'
import { MovementModel } from '@shared/models/model/movement.model'
import { GenericComponent } from '@shared/ui/base/generic.component'
import { DialogElementComponent } from '@shared/ui/domain/dialog-element/dialog-element.component'
import { CommunicationHelper } from '@shared/helpers/communication.helper'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'

/**
 * Purpose: List of the communications of a movement.
 * Scope: Loads and displays the communications of one movement with search and actions.
 * Limits: Reads through the movement, communication and alert facades only.
 */
@Component( {
    selector: 'app-movement-communications-list',
    imports: [
        TranslocoPipe,
        DialogElementComponent,
    ],
    templateUrl: './movement-communications-list.component.html',
    styleUrl: './movement-communications-list.component.css',
} )
export class MovementCommunicationsListComponent extends GenericComponent implements OnInit {
    private readonly destroyRef: DestroyRef = inject( DestroyRef )
    protected readonly facade: MovementFacade = inject( MovementFacade )
    protected readonly communicationFacade: CommunicationFacade = inject( CommunicationFacade )
    protected readonly alertFacade: AlertFacade = inject( AlertFacade )

    public readonly movement: InputSignal<MovementModel> = input.required()

    public ngOnInit (): void {
        this.loadData()
        this.handleCommunicationActions()
    }

    protected loadData (): void {
        this.facade.fetchMovementCommunicationsPage( this.movement().id!, undefined, undefined)
    }

    private handleCommunicationActions (): void {
        this.reloadFirstPageOn( this.communicationFacade.handleCommunicationFirstPageReload() )
        this.reloadFirstPageOn( this.alertFacade.handleAlertCreation() )
        this.reloadCurrentPageOn( this.communicationFacade.handleCommunicationCurrentPageReload() )
    }

    private reloadFirstPageOn (events: Observable<unknown>): void {
        events.pipe(
            tap( (): void => this.facade.fetchMovementCommunicationsPage( this.movement().id, undefined, undefined ) ),
        ).pipe( takeUntilDestroyed( this.destroyRef ) ).subscribe()
    }

    private reloadCurrentPageOn (events: Observable<unknown>): void {
        events.pipe(
            tap( (): void => this.facade.fetchMovementCommunicationsPage(
                this.movement().id,
                this.facade.movementCommunicationsPage()?.page,
                this.facade.movementCommunicationsPage()?.size,
            ) ),
        ).pipe( takeUntilDestroyed( this.destroyRef ) ).subscribe()
    }

    protected getPreviousAuthorId (index: number): string | undefined {
        return CommunicationHelper.previousAuthorId( this.facade.movementCommunicationsPage()?.content, index )
    }

    protected getNextAuthorId (index: number): string | undefined {
        return CommunicationHelper.nextAuthorId( this.facade.movementCommunicationsPage()?.content, index )
    }
}
