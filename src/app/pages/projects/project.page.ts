import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SessionFacade } from '@core/registry/state/session.facade';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';
import { RefreshKindEnum } from '@shared/models/enumeration/refresh-kind.enum';

/**
 * Objectif: Coque de routage de la section des projets.
 * Périmètre: Fournit les facades et stores de la section à ses routes enfants et garde à jour les compteurs du projet sélectionné.
 * Limites: Ne détient aucune donnée propre.
 */
@Component({
	selector: 'app-project',
	imports: [RouterOutlet],
	template: '<router-outlet/>',
	styles: ':host { display: block; width: 100%; }',
})
export class ProjectPage {
	private readonly sessionFacade = inject(SessionFacade);
	private readonly autoRefresh = injectAutoRefresh('project/counts', RefreshKindEnum.COUNTS, () =>
		this.sessionFacade.refreshCurrentProject(),
	);
}
