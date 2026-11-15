import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import '@sgdf/ui/icon';
import '@sgdf/ui/table';
import '@sgdf/ui/table-cell';
import '@sgdf/ui/table-row';

/**
 * Objectif: Cadre commun d'une préférence de la page de compte : titre, contrôle de choix et indication.
 * Périmètre: Affiche l'icône et le titre traduits, projette le contrôle fourni par la section et affiche l'indication traduite.
 * Limites: Ne connaît ni les choix ni la préférence ; la section qui l'utilise les lit et les relaie.
 */
@Component({
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	selector: 'app-account-preference',
	host: { class: 'block h-full' },
	templateUrl: './account-preference.component.html',
})
export class AccountPreferenceComponent {
	public readonly icon = input.required<string>();
	public readonly titleKey = input.required<string>();
	public readonly hintKey = input.required<string>();
}
