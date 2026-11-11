import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';

import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { DateFormatTypeEnum } from '@shared/models/enumeration/date-format-type.enum';
import { OverviewStat } from '@shared/models/model/overview-stat.model';

import '@sgdf/ui/button';
import '@sgdf/ui/divider';
import '@sgdf/ui/icon';
import '@sgdf/ui/table';
import '@sgdf/ui/table-cell';
import '@sgdf/ui/table-row';
import '@sgdf/ui/tag';

/**
 * Objectif: Carte de synthèse d'un projet : un titre, un total, des compteurs et un lien vers le détail.
 * Périmètre: Affiche les compteurs côte à côte (empilés sous 500px), la date de dernière actualisation et le lien.
 * Limites: Ne charge rien ; la vue d'ensemble appelante fournit les compteurs et les libellés.
 */
@Component({
	selector: 'app-project-overview-card',
	imports: [TranslocoPipe, DateFormatPipe, RouterLink],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './project-overview-card.component.html',
})
export class ProjectOverviewCardComponent {
	protected readonly DateFormatTypeEnum = DateFormatTypeEnum;
	public readonly translationPrefix = input.required<string>();
	public readonly icon = input.required<string>();
	public readonly stats = input.required<OverviewStat[]>();
	public readonly total = input<number | undefined>();
	public readonly lastRefresh = input<Date | undefined>();
	public readonly link = input.required<string>();
	public readonly showLink = input(true);
}
