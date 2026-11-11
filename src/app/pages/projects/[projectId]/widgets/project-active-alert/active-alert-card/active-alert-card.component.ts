import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';
import type { SgdfStatusVariant } from '@sgdf/ui';

import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe';
import { StringHelper } from '@shared/helpers/string.helper';
import { DateFormatTypeEnum } from '@shared/models/enumeration/date-format-type.enum';
import { AlertModel } from '@shared/models/model/alert.model';
import { IntervalModel } from '@shared/models/model/interval.model';

import '@sgdf/ui/button';
import '@sgdf/ui/callout';
import '@sgdf/ui/icon';

export interface AlertCard {
	alert: AlertModel;
	variant: SgdfStatusVariant;
	age: IntervalModel | undefined;
}

/**
 * Objectif: Carte d'une alerte ouverte de l'accueil projet.
 * Périmètre: Affiche le titre (ou « sans titre »), la criticité, l'ancienneté et la dernière communication de l'alerte,
 * dans la couleur de sa criticité, et propose d'y communiquer.
 * Limites: N'ouvre pas les communications ; le widget des alertes le fait.
 */
@Component({
	selector: 'app-active-alert-card',
	imports: [TranslocoPipe, DateFormatPipe, IntervalPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	host: { class: 'flex w-72 shrink-0' },
	templateUrl: './active-alert-card.component.html',
	styleUrl: './active-alert-card.component.css',
})
export class ActiveAlertCardComponent {
	protected readonly DateFormatTypeEnum = DateFormatTypeEnum;
	public readonly card = input.required<AlertCard>();
	public readonly canCommunicate = input.required<boolean>();
	public readonly communicate = output();

	protected readonly untitled = computed(() => StringHelper.isNullOrBlank(this.card().alert.title));
}
