import { TitleCasePipe } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, model, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import type { SgdfStatusVariant } from '@sgdf/ui';
import { filter, interval, map } from 'rxjs';

import { BrowserService } from '@core/browser/browser.service';
import { UiFacade } from '@core/registry/state/ui.facade';
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { EllipsisDirective } from '@shared/directives/ellipsis.directive';
import { AlertHelper } from '@shared/helpers/alert.helper';
import { DateHelper } from '@shared/helpers/date.helper';
import { EventHelper } from '@shared/helpers/event.helper';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe';
import { StringHelper } from '@shared/helpers/string.helper';
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum';
import { DateFormatTypeEnum } from '@shared/models/enumeration/date-format-type.enum';
import { AlertModel } from '@shared/models/model/alert.model';
import { IntervalModel } from '@shared/models/model/interval.model';
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component';
import { AlertCommunicationsListComponent } from '@shared/ui/domain/alert-communications-list/alert-communications-list.component';
import { AlertActions } from '@shared/ui/domain/alert-element/alert-actions.service';
import { CommunicationFormComponent } from '@shared/ui/domain/communication-form/communication-form.component';

import '@sgdf/ui/avatar';
import '@sgdf/ui/button';
import '@sgdf/ui/drawer';
import '@sgdf/ui/icon';
import '@sgdf/ui/list-item';
import '@sgdf/ui/tag';

const STATUS_ICONS: Record<string, string> = {
	[AlertStatusEnum.IN_PROGRESS]: 'triangle-exclamation',
	[AlertStatusEnum.CANCELED]: 'xmark',
	[AlertStatusEnum.RESOLVED]: 'circle-check',
};

/** Caractères de largeur nulle qu'un titre peut contenir sans rien afficher. */
const INVISIBLE_CHARACTERS = /[\u200B-\u200D\u2060\uFEFF]/g;

/**
 * Objectif: Présente une alerte avec ses actions, comme élément de liste (attribut de `sgdf-list-item`).
 * Périmètre: Affiche le détail, le menu d'actions, les confirmations et le tiroir listant les communications de l'alerte.
 * Limites: Reçoit l'élément en entrée et appelle la facade pour les commandes ; ne détient aucun état de liste.
 */
@Component({
	selector: 'sgdf-list-item[appAlertElement], app-alert-element',
	providers: [AlertActions],
	host: { '[disabled]': '!alert().visible' },
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [
		EllipsisDirective,
		ElementActionsComponent,
		TitleCasePipe,
		DateFormatPipe,
		TranslocoPipe,
		AlertCommunicationsListComponent,
		CommunicationFormComponent,
	],
	templateUrl: './alert-element.component.html',
	styleUrl: './alert-element.component.css',
})
export class AlertElementComponent {
	protected readonly uiFacade = inject(UiFacade);
	private readonly translateService = inject(TranslocoService);
	protected readonly DateFormatTypeEnum = DateFormatTypeEnum;
	protected readonly facade = inject(AlertFacade);
	private readonly actionsService = inject(AlertActions);
	protected readonly intervalPipe = inject(IntervalPipe);
	private readonly browser = inject(BrowserService);

	public readonly actionMenuVisible = input(true);
	public readonly addButtonVisible = input(true);
	public readonly alert: InputSignal<AlertModel> = input.required();

	protected readonly titleBlank = computed(() =>
		StringHelper.isNullOrBlank(this.alert().title?.replace(INVISIBLE_CHARACTERS, '')),
	);

	protected readonly accessibleTitle: Signal<string> = computed((): string =>
		this.titleBlank() ? this.translateService.translate('alerts.untitled') : this.alert().title,
	);

	protected readonly actions = computed(() => this.actionsService.actionsFor(this.alert()));

	protected readonly isInProgress = computed(() => this.alert().status.value === AlertStatusEnum.IN_PROGRESS);

	protected readonly statusIconName: Signal<string> = computed(
		(): string => STATUS_ICONS[this.alert().status.value] ?? 'circle-check',
	);
	protected readonly statusVariant: Signal<SgdfStatusVariant> = computed((): SgdfStatusVariant =>
		AlertHelper.getTagVariant(this.alert().status.value),
	);

	protected readonly statusLabel = computed(
		() =>
			this.alert().status.label +
			(this.inProgressSince()
				? ` (${this.intervalPipe.transform(this.inProgressSince(), undefined, true)})`
				: ''),
	);

	private readonly inProgressSince = toSignal(
		interval(1000).pipe(
			filter(() => this.browser.pageVisible),
			map(() => this.getInProgressSince()),
		),
	);

	protected readonly communicationsLayerOpened = model<boolean>(false);

	private getInProgressSince(): IntervalModel | undefined {
		if (this.alert().status.value !== AlertStatusEnum.IN_PROGRESS) return undefined;
		return DateHelper.buildDateInterval(this.alert().dateTime, new Date());
	}

	protected closeCommunications(event: Event): void {
		if (EventHelper.isFromHost(event)) {
			this.communicationsLayerOpened.set(false);
		}
	}
}
