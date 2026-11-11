import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

export enum FooterLinkEnum {
	CREATOR = 'creator',
	PRIVACY = 'privacy',
	TERMS = 'terms',
	DOCUMENTATION = 'documentation',
	SUPPORT = 'support',
}

export interface FooterLinkState {
	href: string | null;
	target: string | null;
	rel: string | null;
	newTabHint: string | null;
}

/**
 * Objectif: Pilote le pied de page dans les tests.
 * Périmètre: Lit chaque lien du pied de page (cible, ouverture et mention d'ouverture dans un nouvel onglet), la version et le bord déchiré.
 * Limites: Ne suit pas les liens ; la navigation reste celle du routeur.
 */
export class FooterHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-footer';

	private readonly frame = this.locatorFor(byTestId('footer-frame'));

	public async version(): Promise<string | null> {
		const version = await this.locatorForOptional(byTestId('footer-version-text'))();
		return version ? (await version.text()).trim() : null;
	}

	public async isTorn(): Promise<boolean> {
		return (await this.frame()).getProperty<boolean>('torn');
	}

	public async link(name: FooterLinkEnum): Promise<FooterLinkState | null> {
		const link = await this.locatorForOptional(byTestId(`footer-${name}-link`))();
		if (!link) return null;
		const hint = await this.locatorForOptional(`${byTestId(`footer-${name}-link`)} .sr-only`)();
		return {
			href: await link.getAttribute('href'),
			target: await link.getAttribute('target'),
			rel: await link.getAttribute('rel'),
			newTabHint: hint ? (await hint.text()).trim() : null,
		};
	}
}
