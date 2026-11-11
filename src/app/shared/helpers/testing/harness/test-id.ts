import { TestElement } from '@angular/cdk/testing';

/**
 * Objectif: Construit le sélecteur d'un élément de template à partir de son `data-test-id`.
 * Périmètre: Sert aux harnesses de composants pour localiser leurs éléments sans dépendre de la structure du DOM.
 * Limites: N'échappe pas l'identifiant ; les identifiants suivent le format kebab-case imposé par `testid.spec.ts`.
 */
export function byTestId(testId: string): string {
	return `[data-test-id="${testId}"]`;
}

/**
 * Objectif: Saisit une valeur dans un champ, natif ou web component de @sgdf/ui, comme le ferait l'utilisateur.
 * Périmètre: Positionne la valeur puis émet l'événement `input` que les composants écoutent.
 * Limites: N'émet ni `change` ni les événements clavier.
 */
export async function typeInto(element: TestElement, value: string): Promise<void> {
	await element.setInputValue(value);
	await element.dispatchEvent('input');
}
