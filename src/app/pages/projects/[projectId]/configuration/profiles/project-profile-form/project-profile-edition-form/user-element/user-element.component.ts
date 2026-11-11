import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, InputSignal } from '@angular/core';

import { UserHelper } from '@shared/helpers/user.helper';
import { InvitedUserModel } from '@shared/models/model/invited-user.model';

import '@sgdf/ui/avatar';
import '@sgdf/ui/list';
import '@sgdf/ui/list-item';

/**
 * Objectif: Résumé d'un utilisateur : initiales, nom et e-mail.
 * Périmètre: Affiche l'utilisateur donné comme un seul élément de liste.
 * Limites: Reçoit l'utilisateur en entrée ; n'offre aucune action et ne détient aucun état.
 */
@Component({
	selector: 'app-user-element',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './user-element.component.html',
})
export class UserElementComponent {
	public readonly user: InputSignal<InvitedUserModel> = input.required();

	protected readonly fullName = computed(() => UserHelper.fullName(this.user()));
	protected readonly initials = computed(() => UserHelper.initials(this.user()));
}
