import { Component, inject } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { SessionFacade } from '@core/registry/state/session.facade'
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh'

/**
 * Purpose: Routing shell of the project section.
 * Scope: Provides the facades and stores of the section to its child routes and keeps the counts of the selected project fresh.
 * Limits: Holds no data of its own.
 */
@Component( {
    selector: 'app-project',
    imports: [ RouterOutlet ],
    template: '<router-outlet/>',
    styles: ':host { display: block; width: 100%; }',
} )
export class ProjectPage {
    private readonly sessionFacade: SessionFacade = inject( SessionFacade )
    private readonly autoRefresh: void = injectAutoRefresh( 'project/counts', 'counts', (): void => this.sessionFacade.refreshCurrentProject() )
}
