import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, signal } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import {
	contentOfChoice,
	presenceWarningKey,
} from '@pages/projects/[projectId]/movements/movement-form/shared/movement-form.shared';
import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { ParticipantHelper } from '@shared/helpers/participant.helper';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum';
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum';
import { PresenceWarningSubjectEnum } from '@shared/models/enumeration/presence-warning-subject.enum';
import { MovementContentModel } from '@shared/models/model/movement-content.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';
import { SelectElementsFieldComponent } from '@shared/ui/common/select-elements-field/select-elements-field.component';

import '@sgdf/ui/switch';

/**
 * Objectif: Sélection des participants inscrits d'un mouvement, seuls ou par groupe.
 * Périmètre: Cherche les participants et groupes présents à la date du mouvement, ou tous sur demande, regroupe la
 * sélection par groupe et signale les participants dont le statut contredit le mouvement.
 * Limites: Ne valide rien ; le schéma du formulaire d'inscrits le fait.
 */
@Component({
	selector: 'app-registered-participants-fields',
	imports: [TranslocoPipe, FormField, FieldErrorDirective, PluralTranslationPipe, SelectElementsFieldComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './registered-participants-fields.component.html',
})
export class RegisteredParticipantsFieldsComponent {
	private readonly facade = inject(MovementFacade);
	private readonly translateService = inject(TranslocoService);

	public readonly participants = input.required<FieldTree<MovementContentModel[]>>();
	public readonly dateTime = input.required<Date | null>();
	public readonly presence = input.required<PresenceStatusEnum[]>();

	protected readonly all = signal(false);
	private lastQuery: string | undefined = undefined;

	protected readonly selected = computed(() => this.participants()().value());
	protected readonly suggestions = computed(() =>
		this.facade.searchedParticipantAndGroupMetadata().flatMap((group) => group.items),
	);

	protected readonly contentOfChoice = contentOfChoice;
	protected readonly identifyContent: (content: MovementContentModel) => string = (content) => content.participant.id;
	protected readonly groupOfContent: (content: MovementContentModel) => string | undefined = (content) =>
		content.poolName;
	protected readonly contentLabel: (content: MovementContentModel) => SelectOptionModel<ParticipantModel> = (
		content,
	) => ParticipantHelper.toSelectItem(content.participant);
	protected readonly groupLabel: (name: string) => string = (name) =>
		this.translateService.translate('movements.form.content.registered.group', { name });
	protected readonly warningOf: (content: MovementContentModel) => string | undefined = (content) =>
		this.translateWarning(
			presenceWarningKey(
				PresenceWarningSubjectEnum.PARTICIPANT,
				content.participant.status?.value,
				this.presence(),
			),
		);

	protected search(searched: { query: string }): void {
		this.lastQuery = searched.query;
		this.searchParticipants();
	}

	protected toggleAll(event: Event): void {
		this.all.set((event.target as HTMLElement & { checked: boolean }).checked);
		this.searchParticipants();
	}

	private searchParticipants(): void {
		const at = this.dateTime();
		if (at) this.facade.searchParticipantsAndGroups(ParticipantTypeEnum.REGISTERED, this.lastQuery, at, this.all());
	}

	private translateWarning(key: string | undefined): string | undefined {
		return key === undefined ? undefined : this.translateService.translate(key);
	}
}
