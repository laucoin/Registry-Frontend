import { Component, inject, input, InputSignal, OnDestroy, OnInit } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { Subscription, tap } from 'rxjs'
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade'
import { TranslatePipe } from '@ngx-translate/core'
import { MovementModel } from '@shared/models/model/movement.model'
import { CommunicationFormComponent } from '@shared/ui/communication-form/communication-form.component'
import { GenericComponent } from '@shared/ui/base/generic.component'
import { DialogElementComponent } from '@shared/ui/dialog-element/dialog-element.component'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import { CommunicationHelper } from '@shared/helpers/communication.helper'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'

@Component( {
    selector: 'app-movement-communications-list',
    imports: [
        ReactiveFormsModule,
        TranslatePipe,
        CommunicationFormComponent,
        DialogElementComponent,
    ],
    templateUrl: './movement-communications-list.component.html',
} )
export class MovementCommunicationsListComponent extends GenericComponent implements OnInit, OnDestroy {
    protected readonly facade: MovementFacade = inject( MovementFacade )
    protected readonly communicationFacade: CommunicationFacade = inject( CommunicationFacade )
    protected readonly alertFacade: AlertFacade = inject( AlertFacade )

    private readonly subscriptions: Subscription = new Subscription()

    public readonly movement: InputSignal<MovementModel> = input.required()

    public ngOnInit (): void {
        this.loadData()
        this.handleCommunicationActions()
    }

    protected loadData (): void {
        this.facade.fetchMovementCommunicationsPage( this.movement().id!, undefined, undefined, true )
    }

    private handleCommunicationActions (): void {
        this.subscriptions.add(
            this.communicationFacade.handleCommunicationFirstPageReload().pipe(
                tap( (): void => {
                    this.facade.fetchMovementCommunicationsPage(
                        this.movement().id,
                        undefined,
                        undefined,
                        true,
                    )
                } ),
            ).subscribe(),
        )

        this.subscriptions.add(
            this.alertFacade.handleAlertCreation().pipe(
                tap( (): void => {
                    this.facade.fetchMovementCommunicationsPage(
                        this.movement().id,
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
                        this.movement().id,
                        this.facade.movementCommunicationsPage()?.pageNumber,
                        this.facade.movementCommunicationsPage()?.pageSize,
                        true,
                    )
                } ),
            ).subscribe(),
        )
    }

    protected getPreviousAuthorId (index: number): string | undefined {
        if (index <= 0) return undefined
        const previousCommunication: CommunicationModel = this.facade.movementCommunicationsPage()!.content[index - 1]
        return CommunicationHelper.getAuthorId( previousCommunication )
    }

    protected getNextAuthorId (index: number, isLast: boolean): string | undefined {
        if (isLast) return undefined
        const nextCommunication: CommunicationModel = this.facade.movementCommunicationsPage()!.content[index + 1]
        return CommunicationHelper.getAuthorId( nextCommunication )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }
}
