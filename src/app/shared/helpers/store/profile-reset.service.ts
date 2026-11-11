import { Injectable } from '@angular/core';

/**
 * Objectif: Permet aux stores limités à une route de se réinitialiser ensemble lors d'un changement de profil.
 * Périmètre: Conserve les callbacks de réinitialisation enregistrés et les exécute tous.
 * Limites: Ne décide pas du moment où un changement de profil a lieu.
 */
@Injectable({ providedIn: 'root' })
export class ProfileResetService {
	private readonly resets = new Set<() => void>();

	public register(reset: () => void): () => void {
		this.resets.add(reset);
		return () => {
			this.resets.delete(reset);
		};
	}

	public resetAll(): void {
		this.resets.forEach((reset) => reset());
	}
}
