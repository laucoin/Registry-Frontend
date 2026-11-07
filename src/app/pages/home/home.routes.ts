import { Routes } from '@angular/router';

import { HomeFacade } from '@pages/home/data/state/home.facade';
import { HomeStore } from '@pages/home/data/state/home.store';
import { HomePage } from '@pages/home/home.page';

/**
 * Purpose: Déclare la route de la page d'accueil globale.
 * Scope: Mappe le chemin vide vers la page d'accueil et fournit son store et sa facade.
 * Limits: Ne détient aucune logique de navigation ; les guards et la page la possèdent.
 */
export const homeRoutes: Routes = [
	{
		path: '',
		title: 'seo.home',
		component: HomePage,
		providers: [HomeFacade, HomeStore],
	},
];
