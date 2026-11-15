import { GenericModel } from '@shared/models/model/generic.model';

/**
 * Objectif: Construit la précondition If-Match d'une mise à jour à partir de l'élément que l'utilisateur édite.
 * Périmètre: Dérive l'entity tag de la dernière édition de l'élément, comme le fait le backend, et le transforme en options de requête.
 * Limites: N'envoie rien pour un élément sans dernière édition ; le backend ignore alors la précondition.
 */
export const ETagHelper = {
	ifMatch(element: GenericModel | undefined): string | undefined {
		const lastEdition = element?.lastEdition?.dateTime;
		return lastEdition ? `"${new Date(lastEdition).getTime()}"` : undefined;
	},

	options(ifMatch: string | undefined): { headers?: Record<string, string> } {
		return ifMatch ? { headers: { 'If-Match': ifMatch } } : {};
	},
} as const;
