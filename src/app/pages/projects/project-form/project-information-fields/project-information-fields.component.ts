import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';

import { ProjectFormModel } from '@pages/projects/project-form/project.form';
import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';

import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/input';

/**
 * Objectif: Champs des informations d'un projet : nom et dates de début et de fin.
 * Périmètre: Lie chaque champ au formulaire du projet et affiche ses erreurs.
 * Limites: Ne valide ni n'enregistre rien ; le formulaire de projet le fait.
 */
@Component({
	selector: 'app-project-information-fields',
	imports: [TranslocoPipe, FormField, SgdfFieldDirective, FieldErrorDirective],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './project-information-fields.component.html',
})
export class ProjectInformationFieldsComponent {
	public readonly form = input.required<FieldTree<ProjectFormModel>>();
}
