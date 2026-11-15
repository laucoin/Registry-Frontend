import { ComponentHarness, TestElement } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

export interface ElementActionView {
	id: string | null;
	label: string;
	danger: boolean;
	disabled: boolean;
}

/**
 * Objectif: Pilote le menu d'actions d'un élément dans les tests.
 * Périmètre: Indique si le menu est affiché, lit le libellé du déclencheur et les actions, et lance une action.
 * Limites: N'ouvre pas le menu ; les éléments sont présents dans le DOM même menu fermé.
 */
export class ElementActionsHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-element-actions';

	private readonly trigger = this.locatorForOptional(byTestId('element-actions-button'));
	private readonly items = this.locatorForAll(byTestId('element-actions-item'));

	public async shown(): Promise<boolean> {
		return (await this.trigger()) !== null;
	}

	public async triggerLabel(): Promise<string | undefined> {
		return (await this.trigger())?.getProperty<string>('label');
	}

	public async actions(): Promise<ElementActionView[]> {
		return Promise.all((await this.items()).map((item) => viewOf(item)));
	}

	public async run(id: string): Promise<void> {
		return (await this.locatorFor(`${byTestId('element-actions-item')}[data-id="${id}"]`)()).click();
	}
}

async function viewOf(item: TestElement): Promise<ElementActionView> {
	return {
		id: await item.getAttribute('data-id'),
		label: (await item.text()).trim(),
		danger: (await item.getAttribute('variant')) === 'danger',
		disabled: await item.getProperty<boolean>('disabled'),
	};
}
