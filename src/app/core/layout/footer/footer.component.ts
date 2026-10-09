import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ConfigModel } from "@core/config/model/config.model";
import { RegistryConfig } from "@core/config/registry.config";
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { TranslocoPipe } from "@jsverse/transloco";

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
	protected readonly privacyRoute: string = `/${RegistryRouteEnum.PRIVACY}`;
	protected readonly termsRoute: string = `/${RegistryRouteEnum.TERMS}`;
	protected readonly application: ConfigModel['application'] = RegistryConfig.config.application;
}
