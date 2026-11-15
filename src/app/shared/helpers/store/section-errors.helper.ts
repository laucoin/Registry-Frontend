import { computed, Signal } from '@angular/core';

import { NotificationModel } from '@shared/models/model/notification.model';

type SectionErrors = Record<string, NotificationModel | undefined>;

const METADATA_PREFIX = 'metadata.';

/**
 * Objectif: Lit les erreurs de section d'un store sous forme de signals pour les facades.
 * Périmètre: Donne l'erreur d'une section, ou les erreurs des listes de métadonnées indexées par champ.
 * Limites: Dérivations pures ; les fetchers écrivent les erreurs.
 */
export const SectionErrorsHelper = {
	of(errors: Signal<SectionErrors>, section: string): Signal<NotificationModel | undefined> {
		return computed(() => errors()[section]);
	},

	metadata(errors: Signal<SectionErrors>): Signal<SectionErrors> {
		return computed((): SectionErrors =>
			Object.fromEntries(
				Object.entries(errors())
					.filter(([section, error]) => section.startsWith(METADATA_PREFIX) && error !== undefined)
					.map(([section, error]) => [section.slice(METADATA_PREFIX.length), error]),
			),
		);
	},
} as const;
