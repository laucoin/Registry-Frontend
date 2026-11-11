import { ComponentHarness, TestElement } from '@angular/cdk/testing';

import { byTestId, typeInto } from '@shared/helpers/testing/harness/test-id';

export enum NumberRangeBoundEnum {
	MIN = 'min',
	MAX = 'max',
}

/**
 * Objectif: Pilote le champ de plage numérique dans les tests.
 * Périmètre: Saisit et lit chaque borne, lit son libellé, l'erreur et l'état désactivé, et quitte le champ.
 * Limites: Ne lit pas le libellé du groupe, masqué aux technologies d'assistance au profit de `aria-label`.
 */
export class NumberRangeFieldHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-number-range-field';

	private input(bound: NumberRangeBoundEnum): Promise<TestElement> {
		return this.locatorFor(byTestId(`number-range-field-${bound}-input`))();
	}

	public async type(bound: NumberRangeBoundEnum, value: string): Promise<void> {
		return typeInto(await this.input(bound), value);
	}

	public async value(bound: NumberRangeBoundEnum): Promise<string> {
		return (await this.input(bound)).getProperty<string>('value');
	}

	public async label(bound: NumberRangeBoundEnum): Promise<string> {
		return (await this.input(bound)).getProperty<string>('label');
	}

	public async error(): Promise<string | null> {
		return (await this.input(NumberRangeBoundEnum.MIN)).getAttribute('error');
	}

	public async disabled(): Promise<boolean> {
		return (await this.input(NumberRangeBoundEnum.MIN)).getProperty<boolean>('disabled');
	}

	public async leave(bound: NumberRangeBoundEnum): Promise<void> {
		return (await this.input(bound)).dispatchEvent('focusout');
	}
}
