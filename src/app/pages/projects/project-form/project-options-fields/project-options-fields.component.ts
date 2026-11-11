import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, model } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';

import {
	ProjectOptionsFormModel,
	selectedOptionsState,
	withAllOptions,
} from '@pages/projects/project-form/project.form';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { ProjectOptionIconPipe } from '@shared/helpers/pipe/project-option-icon.pipe';
import { ProjectOptionModel } from '@shared/models/model/project-option.model';

import '@sgdf/ui/checkbox';
import '@sgdf/ui/divider';
import '@sgdf/ui/icon';
import '@sgdf/ui/switch';

/**
 * Objectif: Choix des options d'un projet, avec la sélection de toutes les options d'un coup.
 * Périmètre: Lie un interrupteur par option au formulaire des options, marque la case « tout » cochée, décochée ou
 * partielle, et signale l'option dont un prérequis manque.
 * Limites: Ne valide ni n'enregistre rien ; le formulaire de projet le fait.
 */
@Component({
	selector: 'app-project-options-fields',
	imports: [TranslocoPipe, FormField, SgdfFieldDirective, ProjectOptionIconPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './project-options-fields.component.html',
})
export class ProjectOptionsFieldsComponent {
	public readonly form = input.required<FieldTree<ProjectOptionsFormModel>>();
	public readonly options = input.required<ProjectOptionModel[]>();
	public readonly model = model.required<ProjectOptionsFormModel>();

	protected readonly allSelected = computed(() => selectedOptionsState(this.model()));

	protected selectAll(event: Event): void {
		const checked = (event.target as HTMLInputElement).checked;
		this.model.update((options) => withAllOptions(options, checked));
	}
}
