import { Component, inject, OnDestroy } from '@angular/core'
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { GenericComponent } from '@shared/ui/base/generic.component'
import { ListComponent } from '@shared/ui/common/list/list.component'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { MovementElementComponent } from '@shared/ui/domain/movement-element/movement-element.component'
import { Subscription, tap } from 'rxjs'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'

/**
 * Purpose: Widget listing the current movements without activity.
 * Scope: Displays the current movements and loads more on demand.
 * Limits: Reads through the selected project facade only.
 */
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

    private readonly subscriptions: Subscription = new Subscription()

    public constructor () {
        super()

        this.loadData()
        this.handleMovementActions()
    }

    protected loadData (): void {
        this.facade.fetchCurrentMovementsPageWithoutActivity( undefined, undefined)
    }

    protected loadPage (pageEvent: PageEventModel): void {
        this.facade.fetchCurrentMovementsPageWithoutActivity( pageEvent.pageNumber, pageEvent.pageSize)
    }

    private handleMovementActions (): void {
        this.subscriptions.add(
            this.movementFacade.handleMovementFirstPageReload().pipe(
                tap( (): void => {
                    this.facade.fetchCurrentMovementsPageWithoutActivity(
                        undefined,
                        undefined)
                } ),
            ).subscribe(),
        )

        this.subscriptions.add(
            this.movementFacade.handleMovementCurrentPageReload().pipe(
                tap( (): void => {
                    this.facade.fetchCurrentMovementsPageWithoutActivity(
                        this.facade.currentMovementsPageWithoutActivity()?.pageNumber,
                        this.facade.currentMovementsPageWithoutActivity()?.pageSize)
                } ),
            ).subscribe(),
        )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }
}
