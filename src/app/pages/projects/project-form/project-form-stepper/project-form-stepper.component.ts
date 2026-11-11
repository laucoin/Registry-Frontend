import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { ProjectOptionModel } from '@shared/models/model/project-option.model';

import '@sgdf/ui/stepper';

/**
 * Objectif: Étapes du formulaire de projet : informations, options, puis invitations après une création.
 * Périmètre: Marque l'étape active et celles déjà franchies, et nomme l'étape des options selon leur nombre.
 * Limites: Ne change pas d'étape lui-même ; le formulaire le fait.
 */
@Component({
	selector: 'app-project-form-stepper',
	imports: [TranslocoPipe, PluralTranslationPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './project-form-stepper.component.html',
})
export class ProjectFormStepperComponent {
	public readonly active = input.required<number>();
	public readonly label = input.required<string>();
	public readonly options = input.required<ProjectOptionModel[]>();
	public readonly withInvitation = input.required<boolean>();
}
