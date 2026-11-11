import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

import { RegistryConfig } from '@core/config/registry.config';

/**
 * Objectif: Envoie les requêtes HTTP du domaine generic.
 * Périmètre: Construit les urls et les paramètres de requête et renvoie les réponses du backend.
 * Limites: Ne détient aucun état et ne gère aucune erreur ; les stores et les facades le font.
 */
export abstract class GenericApi {
	protected readonly baseUrl: string;
	protected readonly http = inject(HttpClient);

	protected constructor(baseUrl: string | undefined = undefined) {
		this.baseUrl = this.buildBaseUrl(baseUrl);
	}

	private buildBaseUrl(baseUrl: string | undefined): string {
		let builtUrl = RegistryConfig.environment.backend.url;

		if (baseUrl) {
			builtUrl += baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
		}

		return builtUrl;
	}
}
