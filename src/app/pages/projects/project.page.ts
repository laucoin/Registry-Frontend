import { Component, inject } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { SessionFacade } from '@core/registry/state/session.facade'
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh'

/**
 * Purpose: Coque de routage de la section des projets.
 * Scope: Fournit les facades et stores de la section à ses routes enfants et garde à jour les compteurs du projet sélectionné.
 * Limits: Ne détient aucune donnée propre.
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
