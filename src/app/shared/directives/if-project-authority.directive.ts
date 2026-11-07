import {
	computed,
	Directive,
	effect,
	EmbeddedViewRef,
	inject,
	input,
	TemplateRef,
	ViewContainerRef,
} from '@angular/core';

import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import { SessionFacade } from '@core/registry/state/session.facade';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';

/**
 * Purpose: N'affiche son hôte que si l'utilisateur connecté détient une autorité de projet sur le projet sélectionné.
 * Scope: Lit l'utilisateur courant et le projet sélectionné de la session ; sert à masquer le filtre des éléments supprimés aux rôles qui ne peuvent pas les restaurer.
 * Limits: Simple aide à l'usage ; le backend revérifie chaque requête.
 */
@Directive({
	selector: '[appIfProjectAuthority]',
})
export class IfProjectAuthorityDirective {
	public readonly appIfProjectAuthority = input.required<ProjectAuthorityEnum>();

	private readonly sessionFacade = inject(SessionFacade);
	private readonly template: TemplateRef<unknown> = inject(TemplateRef);
	private readonly container = inject(ViewContainerRef);
	private view: EmbeddedViewRef<unknown> | undefined;

	private readonly allowed = computed(() =>
		CurrentUserHelper.hasProjectAuthority(
			this.sessionFacade.currentUser(),
			this.sessionFacade.selectedProject()?.id,
			this.appIfProjectAuthority(),
		),
	);

	constructor() {
		effect(() => {
			if (this.allowed() && !this.view) {
				this.view = this.container.createEmbeddedView(this.template);
			} else if (!this.allowed() && this.view) {
				this.container.clear();
				this.view = undefined;
			}
		});
	}
}
