import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, output } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import { EventHelper } from '@shared/helpers/event.helper';
import { SelectOptionModel } from '@shared/models/model/select-option.model';
import { UserModel } from '@shared/models/model/user.model';

import '@sgdf/ui/option';
import '@sgdf/ui/select';

/**
 * Objectif: Choix de l'utilisateur lié à un participant.
 * Périmètre: Cherche les utilisateurs du projet, garde l'utilisateur déjà lié parmi les options et signale le choix,
 * ou son effacement.
 * Limites: N'écrit pas dans le formulaire ; le formulaire du participant applique le choix.
 */
@Component({
	selector: 'app-participant-user-select',
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './participant-user-select.component.html',
})
export class ParticipantUserSelectComponent {
	private readonly facade = inject(ParticipantFacade);

	public readonly user = input<SelectOptionModel<UserModel> | null>(null);
	public readonly chosen = output<SelectOptionModel<UserModel> | null>();

	protected readonly choices = computed(() => this.choicesWith(this.facade.searchedUsersMetadata(), this.user()));

	protected search(query: string): void {
		this.facade.searchUsers(query);
	}

	protected choose(event: Event): void {
		const id = EventHelper.valueOf(event);
		this.chosen.emit(this.choices().find((option) => option.value.id === id) ?? null);
	}

	private choicesWith(
		searched: SelectOptionModel<UserModel>[],
		chosen: SelectOptionModel<UserModel> | null,
	): SelectOptionModel<UserModel>[] {
		if (!chosen || searched.some((option) => option.value.id === chosen.value.id)) return searched;
		return [chosen, ...searched];
	}
}
