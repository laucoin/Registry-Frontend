import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { EventHelper } from '@shared/helpers/event.helper';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { ParticipantModel } from '@shared/models/model/participant.model';

import '@sgdf/ui/dialog';
import '@sgdf/ui/icon';
import '@sgdf/ui/list';
import '@sgdf/ui/list-item';

/**
 * Objectif: Dialogue listant tous les groupes d'un participant.
 * Périmètre: S'ouvre quand un participant lui est donné et signale sa fermeture par l'utilisateur.
 * Limites: Ne charge rien ; affiche les groupes portés par le participant.
 */
@Component({
	selector: 'app-participant-groups-dialog',
	imports: [TranslocoPipe, PluralTranslationPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './participant-groups-dialog.component.html',
})
export class ParticipantGroupsDialogComponent {
	public readonly participant = input<ParticipantModel | undefined>();
	public readonly closed = output();

	protected close(event: Event): void {
		if (EventHelper.isFromHost(event)) this.closed.emit();
	}
}
