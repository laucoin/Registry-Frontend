import { DestroyRef, inject, Injectable, signal } from '@angular/core';

/**
 * Purpose: Horloge partagée à la seconde pour les compteurs en direct.
 * Scope: Expose l'horodatage courant sous forme de signal rafraîchi chaque seconde, avec un seul minuteur pour toute l'application.
 * Limits: Précision à la seconde uniquement ; le minuteur vit aussi longtemps que l'application.
 */
@Injectable({ providedIn: 'root' })
export class ClockService {
	private readonly nowState = signal(Date.now());

	public readonly now = this.nowState.asReadonly();

	constructor() {
		const timer = setInterval(() => this.nowState.set(Date.now()), 1000);
		inject(DestroyRef).onDestroy(() => clearInterval(timer));
	}
}
