import { inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslocoService } from '@jsverse/transloco';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { GenericHelper } from '@shared/helpers/generic.helper';

/**
 * Purpose: Classe de base des composants qui ont besoin des facades et helpers partagés.
 * Scope: Fournit les facades UI et de session, le routage et la traduction.
 * Limits: Abstrait ; ne contient aucune logique de vue.
 */
export abstract class GenericComponent {
	protected readonly RegistryRouteEnum = RegistryRouteEnum;

	protected readonly GenericHelper = GenericHelper;

	protected readonly uiFacade = inject(UiFacade);
	protected readonly sessionFacade = inject(SessionFacade);
	protected readonly route = inject(ActivatedRoute);
	protected readonly router = inject(Router);
	protected readonly translateService = inject(TranslocoService);
}
