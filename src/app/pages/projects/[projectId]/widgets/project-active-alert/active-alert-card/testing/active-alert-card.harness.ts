import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

export interface ActiveAlertCardView {
	title: string;
	untitled: boolean;
	variant: string;
	age: string;
	lastCommunication: string | undefined;
	canCommunicate: boolean;
}

/**
 * Objectif: Pilote la carte d'une alerte ouverte de l'accueil projet dans les tests.
 * Périmètre: Lit le titre, la couleur, l'ancienneté, la dernière communication et la présence du bouton de
 * communication, et clique dessus.
 * Limites: Ne lit pas le libellé accessible du bouton.
 */
export class ActiveAlertCardHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-active-alert-card';

	private readonly callout = this.locatorFor(byTestId('active-alert-card-callout'));
	private readonly untitledText = this.locatorForOptional(byTestId('active-alert-card-untitled'));
	private readonly ageText = this.locatorFor(byTestId('active-alert-card-age'));
	private readonly lastText = this.locatorForOptional(byTestId('active-alert-card-last-communication'));
	private readonly communicateButton = this.locatorForOptional(byTestId('active-alert-card-communicate-button'));

	public async view(): Promise<ActiveAlertCardView> {
		const callout = await this.callout();
		return {
			title: await callout.getProperty<string>('title'),
			untitled: (await this.untitledText()) !== null,
			variant: await callout.getProperty<string>('variant'),
			age: (await (await this.ageText()).text()).replace(/\s+/g, ' ').trim(),
			lastCommunication: (await (await this.lastText())?.text())?.replace(/\s+/g, ' ').trim(),
			canCommunicate: (await this.communicateButton()) !== null,
		};
	}

	public async communicate(): Promise<void> {
		return (await this.communicateButton())?.click();
	}
}
