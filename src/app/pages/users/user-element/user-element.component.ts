import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, InputSignal, Signal } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { VisibilityNamePipe } from '@shared/helpers/pipe/visibility.pipe'
import { UserModel } from '@shared/models/model/user.model'
import '@sgdf/ui/avatar'
import '@sgdf/ui/icon'
import '@sgdf/ui/list'
import '@sgdf/ui/list-item'
import '@sgdf/ui/tag'

const INITIALS_LENGTH: number = 2

/**
 * Purpose: Résumé d'un utilisateur : nom, e-mail, anniversaire, rôle et visibilité.
 * Scope: Affiche le détail de l'utilisateur donné comme un seul élément de liste.
 * Limits: Reçoit l'utilisateur en entrée ; n'offre aucune action et ne détient aucun état.
 */
@Component({
	selector: 'app-user-element',
	imports: [TranslocoPipe, DateFormatPipe, VisibilityNamePipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './user-element.component.html',
})
export class UserElementComponent {
	public readonly user: InputSignal<UserModel> = input.required()

	protected readonly fullName: Signal<string> = computed((): string => {
		const user: UserModel = this.user()
		return [user.firstName, user.lastName?.toUpperCase()].filter(Boolean).join(' ') || user.email
	})

	protected readonly initials: Signal<string> = computed((): string => {
		const user: UserModel = this.user()
		const letters: string = [user.firstName, user.lastName].map((name: string | undefined): string => name?.charAt(0) ?? '').join('')
		return (letters || user.email.charAt(0)).slice(0, INITIALS_LENGTH).toUpperCase()
	})
}
