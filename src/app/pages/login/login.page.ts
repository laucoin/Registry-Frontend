import { NgOptimizedImage } from "@angular/common";
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal, WritableSignal } from '@angular/core'
import { RouterLink } from '@angular/router';
import { ConfigModel } from "@core/config/model/config.model";
import { RegistryConfig } from "@core/config/registry.config";
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { RegistryRouteEnum } from "@core/routing/registry-route.enum";
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco'

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
	protected readonly privacyRoute: string = `/${RegistryRouteEnum.PRIVACY}`;
	protected readonly termsRoute: string = `/${RegistryRouteEnum.TERMS}`;

	private readonly facade: RegistryFacade = inject(RegistryFacade)

	protected login(): void {
		this.facade.login()
	}
}
