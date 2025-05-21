import { Component, inject, OnDestroy } from '@angular/core'
import { SelectedProjectFacade } from '../../data/state/selected-project/selected-project.facade'
import { PageEventModel } from '../../../../shared/util-model/model/page-event.model'
import { GenericComponent } from '../../../../shared/util-tool/component/generic.component'
import { Subscription, tap } from 'rxjs'
import { MovementFacade } from '../../movement/data/state/movement.facade'
import { ListComponent } from '../../../../shared/util-ui/list/list.component'
import { MovementElementComponent } from '../../../../shared/util-ui/movement-element/movement-element.component'
import { RegistryTemplateDirective } from '../../../../shared/util-tool/directive/registry-template.directive'

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
        this.facade.fetchCurrentMovementsPageWithActivity( undefined, undefined, false )
    }

    protected loadPage (pageEvent: PageEventModel): void {
        this.facade.fetchCurrentMovementsPageWithActivity( pageEvent.pageNumber, pageEvent.pageSize, false )
    }

    private handleMovementActions (): void {
        this.subscriptions.add(
            this.movementFacade.handleMovementFirstPageReload().pipe(
                tap( (): void => {
                    this.facade.fetchCurrentMovementsPageWithActivity(
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
                    this.facade.fetchCurrentMovementsPageWithActivity(
                        this.facade.currentMovementsPageWithActivity()?.pageNumber,
                        this.facade.currentMovementsPageWithActivity()?.pageSize,
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
