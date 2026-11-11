import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { ElementActionsHarness } from '@shared/ui/common/element-actions/testing/element-actions.harness';

/**
 * Objectif: Pilote un message de conversation dans les tests.
 * Périmètre: Lit l'auteur, le message, l'alerte citée, les marques « masqué » et « modifié », la place du message
 * (envoyé par l'utilisateur, groupé avec le précédent) et donne ses actions.
 * Limites: Ne lit pas la date affichée, mise en forme par le pipe de date.
 */
export class DialogElementHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-dialog-element';

	private readonly message = this.locatorFor(byTestId('dialog-element-message'));
	private readonly avatar = this.locatorForOptional(byTestId('dialog-element-avatar'));
	private readonly hidden = this.locatorForOptional(byTestId('dialog-element-hidden'));
	private readonly author = this.locatorForOptional(byTestId('dialog-element-author'));
	private readonly alertTitle = this.locatorForOptional(byTestId('dialog-element-alert-title'));
	private readonly alertStatus = this.locatorForOptional(byTestId('dialog-element-alert-status'));
	private readonly content = this.locatorFor(byTestId('dialog-element-content'));
	private readonly updated = this.locatorForOptional(byTestId('dialog-element-updated'));

	public readonly actions = this.locatorFor(
		new HarnessPredicate(ElementActionsHarness, { selector: byTestId('dialog-element-actions') }),
	);

	public async authorName(): Promise<string | undefined> {
		return (await (await this.author())?.text())?.trim();
	}

	public async text(): Promise<string> {
		return (await this.content()).text();
	}

	public async own(): Promise<boolean> {
		return (await this.message()).hasClass('own');
	}

	public async grouped(): Promise<boolean> {
		return (await this.message()).hasClass('grouped');
	}

	public async avatarShown(): Promise<boolean> {
		return (await this.avatar()) !== null;
	}

	public async hiddenShown(): Promise<boolean> {
		return (await this.hidden()) !== null;
	}

	public async updatedShown(): Promise<boolean> {
		return (await this.updated()) !== null;
	}

	public async alert(): Promise<{ title: string; status: string; variant: string } | undefined> {
		const title = await this.alertTitle();
		const status = await this.alertStatus();
		if (!title || !status) return undefined;
		return {
			title: (await title.text()).trim(),
			status: (await status.text()).trim(),
			variant: await status.getProperty<string>('variant'),
		};
	}
}
