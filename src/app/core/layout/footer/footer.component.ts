import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ConfigModel } from "@core/config/model/config.model";
import { RegistryConfig } from "@core/config/registry.config";
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { RouteHelper } from '@shared/helpers/route.helper'
import { TranslocoPipe } from "@jsverse/transloco";
import '@sgdf/ui/avatar'
import '@sgdf/ui/footer'

/**
 * Purpose: Footer of the application.
 * Scope: Shows the legal links, the optional support link and the creator credits from the runtime configuration.
 * Limits: Holds no state and does not fetch anything; the links come from the configuration and the routes.
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
	protected readonly creationYear: number = 2021;
	protected readonly currentYear: number = new Date().getFullYear();
	protected readonly privacyRoute: string = RouteHelper.absolute(RegistryRouteEnum.PRIVACY);
	protected readonly termsRoute: string = RouteHelper.absolute(RegistryRouteEnum.TERMS);
	protected readonly application: ConfigModel['application'] = RegistryConfig.config.application;
}
