import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, Signal } from '@angular/core';

import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import type { SgdfStatusVariant } from '@sgdf/ui';

import { SessionFacade } from '@core/registry/state/session.facade';
import { AlertHelper } from '@shared/helpers/alert.helper';
import { CommunicationHelper } from '@shared/helpers/communication.helper';
import { DateHelper } from '@shared/helpers/date.helper';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { StringHelper } from '@shared/helpers/string.helper';
import { DateFormatTypeEnum } from '@shared/models/enumeration/date-format-type.enum';
import { CommunicationModel } from '@shared/models/model/communication.model';
import { CurrentUserModel } from '@shared/models/model/current-user.model';
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component';
import { CommunicationActions } from '@shared/ui/domain/dialog-element/communication-actions.service';

import '@sgdf/ui/avatar';
import '@sgdf/ui/icon';
import '@sgdf/ui/tag';

function movementAuthorName(communication: CommunicationModel): string | undefined {
	const label = communication.movement?.reason?.label;
	return StringHelper.isNotNullNorBlank(label) ? label : undefined;
}

function editorName(communication: CommunicationModel): string | undefined {
	const editor = communication.lastEdition?.user;
	return editor && StringHelper.isNotNullNorBlank(editor.firstName)
		? `${editor.firstName} ${editor.lastName}`
		: undefined;
}

/**
 * Objectif: Bulle de discussion présentant une communication, alignée du côté de son auteur.
 * Périmètre: Affiche l'auteur, l'alerte liée, le message, sa date et le menu d'actions de la communication.
 * Limites: Ne possède aucun état de liste ; le parent donne les auteurs voisins pour que les messages consécutifs soient groupés.
 */
@Component({
	selector: 'app-dialog-element',
	providers: [CommunicationActions],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [DateFormatPipe, ElementActionsComponent, TranslocoPipe],
	templateUrl: './dialog-element.component.html',
	styleUrl: './dialog-element.component.css',
})
export class DialogElementComponent {
	private readonly sessionFacade = inject(SessionFacade);
	private readonly translateService = inject(TranslocoService);
	protected readonly DateFormatTypeEnum = DateFormatTypeEnum;
	private readonly actionsService = inject(CommunicationActions);

	public readonly alertVisible = input(false);
	public readonly communication: InputSignal<CommunicationModel> = input.required();
	public readonly previousAuthorId: InputSignal<string | undefined> = input();
	public readonly nextAuthorId: InputSignal<string | undefined> = input();

	protected readonly actions = computed(() => this.actionsService.actionsFor(this.communication()));

	protected readonly firstAuthorMessage = computed(
		() => CommunicationHelper.getAuthorId(this.communication()) !== this.previousAuthorId(),
	);

	protected readonly authorIsCurrentUser = computed(() =>
		this.buildAuthorIsCurrentUser(this.communication(), this.sessionFacade.currentUser()),
	);

	protected readonly alertTitleBlank = computed(() => StringHelper.isNullOrBlank(this.communication().alert?.title));

	protected readonly authorName = computed(() => this.buildAuthorName(this.communication()));

	protected readonly alertVariant: Signal<SgdfStatusVariant> = computed((): SgdfStatusVariant =>
		AlertHelper.getTagVariant(this.communication().alert?.status?.value),
	);

	protected readonly updated = computed(() =>
		DateHelper.isAfter(this.communication().lastEdition?.dateTime, this.communication().creation?.dateTime),
	);

	private buildAuthorIsCurrentUser(
		communication: CommunicationModel,
		currentUser: CurrentUserModel | undefined,
	): boolean {
		return (
			movementAuthorName(communication) === undefined && communication.lastEdition?.user?.id === currentUser?.id
		);
	}

	private buildAuthorName(communication: CommunicationModel): string {
		return (
			movementAuthorName(communication) ??
			editorName(communication) ??
			this.translateService.translate('communications.no-author')
		);
	}
}
