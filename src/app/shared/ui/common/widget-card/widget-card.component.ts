import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';

import type { SgdfIconLibrary } from '@sgdf/ui';

import { WidgetStateEnum } from '@shared/models/enumeration/widget-state.enum';
import { NotificationModel } from '@shared/models/model/notification.model';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';
import { SkeletonListComponent } from '@shared/ui/common/skeleton-list/skeleton-list.component';

import '@sgdf/ui/icon';
import '@sgdf/ui/table';
import '@sgdf/ui/table-cell';
import '@sgdf/ui/table-row';
import '@sgdf/ui/tag';

/**
 * Objectif: Cadre commun des widgets des pages d'accueil : en-tête (icône, titre, total), erreur, chargement, état vide.
 * Périmètre: Affiche l'état donné par le widget et projette son contenu (`widget-intro` sous l'en-tête, le contenu par
 * défaut, `widget-loading` pour remplacer le squelette, `widget-footer` en pied) ; relaie la demande de réessai.
 * Limites: Ne charge rien et ne traduit rien : le widget fournit les textes déjà traduits et calcule son état.
 */
@Component({
	selector: 'app-widget-card',
	imports: [SectionErrorComponent, SkeletonListComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './widget-card.component.html',
})
export class WidgetCardComponent {
	protected readonly WidgetStateEnum = WidgetStateEnum;

	public readonly icon = input.required<string>();
	public readonly iconLibrary = input<SgdfIconLibrary>('solid');
	public readonly heading = input.required<string>();
	public readonly totalLabel = input<string | undefined>();
	public readonly state = input.required<WidgetStateEnum>();
	public readonly emptyMessage = input('');
	public readonly error = input<NotificationModel | undefined>();
	public readonly retrying = input(false);

	public readonly retry = output();
}
