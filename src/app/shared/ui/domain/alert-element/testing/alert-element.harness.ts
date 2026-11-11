import { ComponentHarness, HarnessPredicate, TestElement } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { ElementActionsHarness } from '@shared/ui/common/element-actions/testing/element-actions.harness';

/**
 * Objectif: Pilote l'élément de liste d'une alerte dans les tests.
 * Périmètre: Lit le titre, le statut (libellé, icône, couleur), l'état masqué et désactivé, le bouton des
 * communications, les actions, et ouvre ou ferme la couche des communications.
 * Limites: Ne lit pas la date, mise en forme par le pipe de date, ni les communications elles-mêmes.
 */
export class AlertElementHarness extends ComponentHarness {
	public static readonly hostSelector = '[appAlertElement], app-alert-element';

	private readonly titleElement = this.locatorForOptional(byTestId('alert-element-title'));
	private readonly untitled = this.locatorForOptional(byTestId('alert-element-untitled'));
	private readonly avatar = this.locatorFor(byTestId('alert-element-avatar'));
	private readonly statusIcon = this.locatorFor(byTestId('alert-element-status-icon'));
	private readonly status = this.locatorFor(byTestId('alert-element-status'));
	private readonly hiddenTag = this.locatorForOptional(byTestId('alert-element-hidden-tag'));
	private readonly communicationsButtonLocator = this.locatorForOptional(
		byTestId('alert-element-communications-button'),
	);
	private readonly drawer = this.locatorFor(byTestId('alert-element-communications-drawer'));
	private readonly communicationForm = this.locatorForOptional(byTestId('alert-element-communication-form'));

	public readonly actions = this.locatorFor(
		new HarnessPredicate(ElementActionsHarness, { selector: byTestId('alert-element-actions') }),
	);

	public async title(): Promise<string> {
		const element: TestElement | null = (await this.titleElement()) ?? (await this.untitled());
		return (await element?.text()) ?? '';
	}

	public async untitledShown(): Promise<boolean> {
		return (await this.untitled()) !== null;
	}

	public async statusLabel(): Promise<string> {
		return (await (await this.status()).text()).trim();
	}

	public async statusIconName(): Promise<string> {
		return (await this.statusIcon()).getProperty<string>('name');
	}

	public async variants(): Promise<{ avatar: string; status: string }> {
		return {
			avatar: await (await this.avatar()).getProperty<string>('variant'),
			status: await (await this.status()).getProperty<string>('variant'),
		};
	}

	public async hiddenShown(): Promise<boolean> {
		return (await this.hiddenTag()) !== null;
	}

	public async disabled(): Promise<boolean> {
		return (await this.host()).getProperty<boolean>('disabled');
	}

	public async communicationsButton(): Promise<{ text: string; variant: string } | undefined> {
		const button = await this.communicationsButtonElement();
		if (!button) return undefined;
		return {
			text: (await button.text()).replace(/\s+/g, ' ').trim(),
			variant: await button.getProperty<string>('variant'),
		};
	}

	public async openCommunications(): Promise<void> {
		return (await this.communicationsButtonElement())?.click();
	}

	public async communicationFormShown(): Promise<boolean> {
		return (await this.communicationForm()) !== null;
	}

	public async hideCommunications(): Promise<void> {
		return (await this.drawer()).dispatchEvent('sgdf-hide');
	}

	private communicationsButtonElement(): Promise<TestElement | null> {
		return this.communicationsButtonLocator();
	}
}
