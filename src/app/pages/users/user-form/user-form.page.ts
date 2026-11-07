import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';
import { filter, map } from 'rxjs';

import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { UserFacade } from '@pages/users/data/state/user.facade';
import { createUserForm, toUserFormModel } from '@pages/users/user-form/user.form';
import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { UserModel } from '@shared/models/model/user.model';
import { BaseFormComponent } from '@shared/ui/base/base-form.component';
import { FormDialogComponent } from '@shared/ui/common/form-dialog/form-dialog.component';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';

import '@sgdf/ui/option';
import '@sgdf/ui/select';

/**
 * Purpose: Page en dialogue avec le formulaire d'édition d'un utilisateur, ouverte au-dessus de la liste des utilisateurs.
 * Scope: Construit le formulaire, le soumet via la facade et navigue en arrière ; affiche l'échec du chargement de l'utilisateur ou des rôles à la place du formulaire.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-user-form',
	imports: [
		FormDialogComponent,
		SgdfFieldDirective,
		FieldErrorDirective,
		TranslocoPipe,
		FormField,
		SectionErrorComponent,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './user-form.page.html',
})
export class UserFormPage extends BaseFormComponent {
	protected override readonly closesToParentRoute: boolean = true;
	protected readonly facade = inject(UserFacade);

	protected readonly model = signal(toUserFormModel());
	protected readonly form = createUserForm(this.model);
	protected readonly loadError = computed(
		() => this.facade.userError() ?? this.facade.metadataErrors()['assignableRoles'],
	);

	constructor() {
		super();

		this.destroyRef.onDestroy(() => this.facade.resetUser());

		this.loadData();

		this.handleLoadedElement();
	}

	protected override loadData(): void {
		this.facade.resetUser();

		if (!this.idParam) {
			this.router.navigateByUrl(RegistryRouteEnum.USERS).catch((): void => undefined);
		} else {
			this.facade.fetchAssignableRoles();
			this.facade.fetchUser(this.idParam);
		}
	}

	protected handleLoadedElement(): void {
		this.facade.user$
			.pipe(
				filter((it): it is UserModel => GenericHelper.nonNull(it)),
				map((it) => this.fillForm(it)),
			)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe();
	}

	protected fillForm(element: UserModel): void {
		this.model.set(toUserFormModel(element));
	}

	protected submit(): void {
		if (!this.isFormValid(this.form)) {
			return;
		}

		const user = this.facade.user();
		if (!user) return;

		this.save(this.facade.updateUserRole(user.id, this.model().role));
	}

	protected get idParam(): string | undefined {
		return this.route.snapshot.params['userId'];
	}
}
