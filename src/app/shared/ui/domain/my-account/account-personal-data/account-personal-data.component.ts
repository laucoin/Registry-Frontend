import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterLink } from "@angular/router";
import { RegistryRouteEnum } from "@core/routing/registry-route.enum";
import { RouteHelper } from "@shared/helpers/route.helper";
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";

/**
 * Purpose: Presents the GDPR rights of the signed-in user: the data extract and the account deletion.
 * Scope: Displays both actions with their explanation and a link to the privacy page.
 * Limits: Triggers no request yet; the extract and the deletion are not wired to the backend.
 */
@Component({
	imports: [
		TranslocoPipe,
		RouterLink,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('my-account')],
	selector: 'app-account-personal-data',
	styleUrl: './account-personal-data.component.css',
	templateUrl: './account-personal-data.component.html',
})
export class AccountPersonalDataComponent {
	protected readonly privacyRoute: string = RouteHelper.absolute(RegistryRouteEnum.PRIVACY)
}
