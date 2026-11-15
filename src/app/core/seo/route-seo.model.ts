export const SEO_DATA_KEY = 'seo';

export interface RouteSeoModel {
	descriptionKey: string;
}

export interface PageSeoModel {
	titleKey: string;
	url: string;
	descriptionKey?: string;
}
