import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';

import '@sgdf/ui/button';
import '@sgdf/ui/icon';

/**
 * Objectif: Résumé de l'appel du suivi des participants : nombre de participants cochés et remise à zéro.
 * Périmètre: Annonce le nombre de participants cochés, propose de tout décocher quand il y en a, et rappelle que
 * l'appel n'est pas enregistré.
 * Limites: Ne garde pas les coches ; la page les détient et les efface.
 */
@Component({
	selector: 'app-participants-roll-call',
	imports: [TranslocoPipe, PluralTranslationPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './participants-roll-call.component.html',
})
export class ParticipantsRollCallComponent {
	public readonly checkedCount = input.required<number>();
	public readonly uncheckedAll = output();
}
