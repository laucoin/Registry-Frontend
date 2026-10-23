import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnDestroy } from '@angular/core'
import '@sgdf/ui/list-item'
import { Subscription, tap } from 'rxjs'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { ListComponent } from '@shared/ui/common/list/list.component'
import { MovementElementComponent } from '@shared/ui/domain/movement-element/movement-element.component'

/**
 * Purpose: Widget listing the current movements with activity.
 * Scope: Displays the current movements with a "load more" trigger and reloads them when a movement changes.
 * Limits: Reads through the selected project facade only.
 */
@Component( {
    selector: 'app-current-activities',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        MovementElementComponent,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './current-activities.component.html',
} )
export class CurrentActivitiesComponent implements OnDestroy {
    protected readonly facade: SelectedProjectFacade = inject( SelectedProjectFacade )
    private readonly movementFacade: MovementFacade = inject( MovementFacade )

    private readonly subscriptions: Subscription = new Subscription()

    public constructor () {
        this.facade.fetchCurrentMovementsPageWithActivity( undefined, undefined )
        this.handleMovementActions()
    }

    protected loadBatch (pageEvent: PageEventModel): void {
        this.facade.fetchCurrentMovementsPageWithActivity( pageEvent.pageNumber, pageEvent.pageSize )
    }

    private handleMovementActions (): void {
        this.subscriptions.add(
            this.movementFacade.handleMovementFirstPageReload().pipe(
                tap( (): void => this.facade.fetchCurrentMovementsPageWithActivity( 0, undefined ) ),
            ).subscribe(),
        )
        this.subscriptions.add(
            this.movementFacade.handleMovementCurrentPageReload().pipe(
                tap( (): void => this.facade.reloadCurrentMovementsPageWithActivity() ),
            ).subscribe(),
        )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }
}
