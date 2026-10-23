import { Component, inject, OnDestroy } from '@angular/core'
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { GenericComponent } from '@shared/ui/base/generic.component'
import { Subscription, tap } from 'rxjs'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { ListComponent } from '@shared/ui/common/list/list.component'
import { MovementElementComponent } from '@shared/ui/domain/movement-element/movement-element.component'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'

@Component( {
    selector: 'app-current-activities',
    imports: [
        ListComponent,
        MovementElementComponent,
        RegistryTemplateDirective,
    ],
    templateUrl: './current-activities.component.html',
} )
export class CurrentActivitiesComponent extends GenericComponent implements OnDestroy {
    protected readonly facade: SelectedProjectFacade = inject( SelectedProjectFacade )
    protected readonly movementFacade: MovementFacade = inject( MovementFacade )

    private readonly subscriptions: Subscription = new Subscription()

    public constructor () {
        super()

        this.loadData()
        this.handleMovementActions()
    }

    protected loadData (): void {
        this.facade.fetchCurrentMovementsPageWithActivity( undefined, undefined)
    }

    protected loadPage (pageEvent: PageEventModel): void {
        this.facade.fetchCurrentMovementsPageWithActivity( pageEvent.pageNumber, pageEvent.pageSize)
    }

    private handleMovementActions (): void {
        this.subscriptions.add(
            this.movementFacade.handleMovementFirstPageReload().pipe(
                tap( (): void => {
                    this.facade.fetchCurrentMovementsPageWithActivity(
                        undefined,
                        undefined)
                } ),
            ).subscribe(),
        )

        this.subscriptions.add(
            this.movementFacade.handleMovementCurrentPageReload().pipe(
                tap( (): void => {
                    this.facade.fetchCurrentMovementsPageWithActivity(
                        this.facade.currentMovementsPageWithActivity()?.pageNumber,
                        this.facade.currentMovementsPageWithActivity()?.pageSize)
                } ),
            ).subscribe(),
        )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }
}
