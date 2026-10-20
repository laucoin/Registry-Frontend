import { Routes } from '@angular/router'
import { HomePage } from '@pages/home/home.page'
import { HomeFacade } from '@pages/home/data/state/home.facade'
import { HomeStore } from '@pages/home/data/state/home.store'

/**
 * Purpose: Declares the route of the global home page.
 * Scope: Maps the empty path to the home page and provides its store and facade.
 * Limits: Holds no navigation logic; the guards and the page own it.
 */
export const homeRoutes: Routes = [
	{
		path: '',
		component: HomePage,
		providers: [HomeFacade, HomeStore],
	},
]
