import { Component, inject, OnDestroy } from '@angular/core'
import { SelectedProjectFacade } from '../../data/state/selected-project/selected-project.facade'
import { PageEventModel } from '../../../../shared/util-model/model/page-event.model'
import { GenericComponent } from '../../../../shared/util-tool/component/generic.component'
import { ListComponent } from '../../../../shared/util-ui/list/list.component'
import { RegistryTemplateDirective } from '../../../../shared/util-tool/directive/registry-template.directive'
import { MovementElementComponent } from '../../../../shared/util-ui/movement-element/movement-element.component'
import { Subscription, tap } from 'rxjs'
import { MovementFacade } from '../../movement/data/state/movement.facade'
import { MovementModel } from '../../../../shared/util-model/model/movement.model'
import { CommunicationFacade } from '../../communication/data/state/communication.facade'

@Component( {
    selector: 'app-current-movements',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        MovementElementComponent,
    ],
    templateUrl: './current-movements.component.html',
} )
export class CurrentMovementsComponent extends GenericComponent implements OnDestroy {
    protected readonly facade: SelectedProjectFacade = inject( SelectedProjectFacade )
    protected readonly movementFacade: MovementFacade = inject( MovementFacade )
    protected readonly communicationFacade: CommunicationFacade = inject( CommunicationFacade )

    private readonly subscriptions: Subscription = new Subscription()

    public constructor () {
        super()

        this.loadData()
        this.handleMovementActions()
        this.handleCommunicationsActions()
    }

    protected loadData (): void {
        this.facade.fetchCurrentMovementsPageWithoutActivity( undefined, undefined, false )
    }

    protected loadPage (pageEvent: PageEventModel): void {
        this.facade.fetchCurrentMovementsPageWithoutActivity( pageEvent.pageNumber, pageEvent.pageSize, false )
    }

    private handleMovementActions (): void {
        this.subscriptions.add(
            this.movementFacade.handleMovementFirstPageReload().pipe(
                tap( (): void => {
                    this.facade.fetchCurrentMovementsPageWithoutActivity(
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
                    this.facade.fetchCurrentMovementsPageWithoutActivity(
                        this.facade.currentMovementsPageWithoutActivity()?.pageNumber,
                        this.facade.currentMovementsPageWithoutActivity()?.pageSize,
                        true,
                    )
                } ),
            ).subscribe(),
        )
    }

    private handleCommunicationsActions (): void {
        this.subscriptions.add(
            this.communicationFacade.handleCommunicationChange().pipe(
                tap( (): void => {
                    if ((this.facade.currentMovementsPageWithActivity()?.content ?? []).length > 0) {
                        this.facade.fetchCurrentMovementsPageWithoutActivityCommunicationsIfNecessary(
                            this.facade.currentMovementsPageWithActivity()!.content!.map( (movement: MovementModel): string => movement.id ),
                            false,
                        )
                    }
                } ),
            ).subscribe(),
        )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }
}
