import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, input, output } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';

import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import { ParticipantsListSearchModel } from '@pages/projects/[projectId]/configuration/participants/participants-list/participants-list.search';
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { SortFieldsComponent } from '@shared/ui/common/sort-fields/sort-fields.component';

import '@sgdf/ui/input';
import '@sgdf/ui/option';
import '@sgdf/ui/select';

/**
 * Objectif: Champs de recherche des participants, dans leur liste de configuration et dans leur suivi.
 * Périmètre: Lie le texte, le statut de présence, la visibilité et le tri au formulaire de la page, et signale quand
 * l'utilisateur valide le texte saisi.
 * Limites: Ne lance pas la recherche ; la page le fait. Le filtre de visibilité ne s'affiche que si la page donne
 * l'autorité qui le réserve, et seulement aux utilisateurs qui la détiennent.
 */
@Component({
	selector: 'app-participants-search-fields',
	imports: [
		TranslocoPipe,
		FormField,
		SgdfFieldDirective,
		BooleanChoicePipe,
		SortFieldsComponent,
		IfProjectAuthorityDirective,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './participants-search-fields.component.html',
})
export class ParticipantsSearchFieldsComponent {
	protected readonly facade = inject(ParticipantFacade);

	public readonly form = input.required<FieldTree<ParticipantsListSearchModel>>();
	public readonly sortFields = input.required<readonly string[]>();
	public readonly hiddenAuthority = input<ProjectAuthorityEnum | undefined>();
	public readonly searched = output();
}
