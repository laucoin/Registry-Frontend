import { NgOptimizedImage } from "@angular/common";
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal, WritableSignal } from '@angular/core'
import { RouterLink } from '@angular/router';
import { ConfigModel } from "@core/config/model/config.model";
import { RegistryConfig } from "@core/config/registry.config";
import { SessionFacade } from '@core/registry/state/session.facade'
import { RegistryRouteEnum } from "@core/routing/registry-route.enum";
import { RouteHelper } from "@shared/helpers/route.helper";
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/icon'
import '@sgdf/ui/page-title'

/**
 * Purpose: Sign-in page of the application.
 * Scope: Presents the application and starts the sign-in through the session facade.
 * Limits: Does not handle the identity provider callback; the auth callback page does.
 */
@Component({
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [TranslocoPipe, NgOptimizedImage, RouterLink],
	providers: [provideTranslocoScope('login')],
	templateUrl: './login.page.html',
	styleUrl: './login.page.css',
})
export class LoginPage {
	protected readonly application: ConfigModel['application'] = RegistryConfig.config.application;
	protected readonly heroPhotoLoaded: WritableSignal<boolean> = signal(false);
	protected readonly privacyRoute: string = RouteHelper.absolute(RegistryRouteEnum.PRIVACY);
	protected readonly termsRoute: string = RouteHelper.absolute(RegistryRouteEnum.TERMS);

	private readonly facade: SessionFacade = inject(SessionFacade)

	protected readonly redirecting: WritableSignal<boolean> = signal(false);

	protected login(): void {
		this.redirecting.set(true)
		this.facade.login()
	}
}
