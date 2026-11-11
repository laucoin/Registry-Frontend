import { NgOptimizedImage } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { RegistryConfig } from '@core/config/registry.config';
import { SessionFacade } from '@core/registry/state/session.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { RouteHelper } from '@shared/helpers/route.helper';

import '@sgdf/ui/button';
import '@sgdf/ui/icon';
import '@sgdf/ui/page-title';

/**
 * Objectif: Page de connexion de l'application.
 * Périmètre: Présente l'application et démarre la connexion via la facade de session.
 * Limites: Ne gère pas le callback du fournisseur d'identité ; la page de callback d'authentification le fait.
 */
@Component({
	selector: 'app-login',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [TranslocoPipe, NgOptimizedImage, RouterLink],
	providers: [provideTranslocoScope('login')],
	templateUrl: './login.page.html',
	styleUrl: './login.page.css',
})
export class LoginPage {
	protected readonly application = RegistryConfig.config.application;
	protected readonly heroPhotoLoaded = signal(false);
	protected readonly privacyRoute = RouteHelper.absolute(RegistryRouteEnum.PRIVACY);
	protected readonly termsRoute = RouteHelper.absolute(RegistryRouteEnum.TERMS);

	private readonly facade = inject(SessionFacade);

	protected readonly redirecting = signal(false);

	protected login(): void {
		this.redirecting.set(true);
		this.facade.login();
	}
}
