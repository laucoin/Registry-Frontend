import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core';
import { RegistryConfig } from "@core/config/registry.config";
import { SessionFacade } from "@core/registry/state/session.facade";
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";
import { CurrentUserModel } from "@shared/models/model/current-user.model";

/**
 * Purpose: Shows the read-only identity of the signed-in user: name, e-mail, role and last sign-in.
 * Scope: Reads the current user from the session facade and displays a skeleton while it loads.
 * Limits: Edits nothing; these values belong to the identity provider.
 */
@Component({
	imports: [
		TranslocoPipe,
		NgTemplateOutlet,
	],
	selector: 'app-account-info',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('my-account')],
	styleUrl: './account-info.component.css',
	templateUrl: './account-info.component.html',
})
export class AccountInfoComponent {
	private readonly sessionFacade: SessionFacade = inject(SessionFacade)

	protected readonly organization: string = RegistryConfig.config.application.organization;

	protected readonly currentUser: Signal<CurrentUserModel | undefined> = this.sessionFacade.currentUser
	protected readonly fullName: Signal<string | undefined> = computed((): string | undefined => {
		const user: CurrentUserModel | undefined = this.currentUser()
		return user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email : undefined
	})
}
