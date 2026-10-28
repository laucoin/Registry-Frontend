import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ConfigModel } from "@core/config/model/config.model";
import { RegistryConfig } from "@core/config/registry.config";
import { UiFacade } from '@core/registry/state/ui.facade'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { RouteHelper } from '@shared/helpers/route.helper'
import { TranslocoPipe } from "@jsverse/transloco";
import '@sgdf/ui/avatar'
import '@sgdf/ui/footer'

/**
 * Purpose: Pied de page de l'application.
 * Scope: Affiche les liens légaux, le lien de support optionnel et les crédits du créateur issus de la configuration d'exécution.
 * Limits: Ne détient aucun état et ne récupère rien ; les liens viennent de la configuration et des routes.
 */
@Component({
	selector: 'app-footer',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './footer.component.html',
	styleUrl: './footer.component.css',
	imports: [
		RouterLink,
		TranslocoPipe
	]
})
export class FooterComponent {
	protected readonly uiFacade: UiFacade = inject(UiFacade);
	protected readonly creationYear: number = 2021;
	protected readonly currentYear: number = new Date().getFullYear();
	protected readonly privacyRoute: string = RouteHelper.absolute(RegistryRouteEnum.PRIVACY);
	protected readonly termsRoute: string = RouteHelper.absolute(RegistryRouteEnum.TERMS);
	protected readonly application: ConfigModel['application'] = RegistryConfig.config.application;
}
