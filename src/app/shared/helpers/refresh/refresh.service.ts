import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { timer } from 'rxjs';

import { BrowserService } from '@core/browser/browser.service';
import { UiFacade } from '@core/registry/state/ui.facade';
import { REFRESH_INTERVALS, REFRESH_TICK_MS } from '@shared/helpers/refresh/refresh.config';
import { RefreshKindEnum } from '@shared/models/enumeration/refresh-kind.enum';

interface RefreshSourceModel {
	key: string;
	kind: RefreshKindEnum;
	reload: () => void;
	host: Element;
}

interface RefreshEntry extends RefreshSourceModel {
	lastRunAt: number;
	lastRunDay: string;
	visible: boolean;
	markRun(now: number): void;
}

const dayOf = (time: number): string => {
	const date = new Date(time);
	return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

/**
 * Objectif: Recharge en arrière-plan les données à l'écran pour qu'elles ne soient jamais périmées.
 * Périmètre: Conserve les sources enregistrées, suit si l'élément hôte de chacune est à l'écran, les vérifie sur un tick global unique et recharge chacune de celles qui sont dues : au-delà de son intervalle pour son type (fixé par le mode de rafraîchissement de l'utilisateur) ou, pour les données journalières, après minuit. Ne fait rien pour une source hors écran, quand l'onglet est caché ou que le navigateur est hors ligne, et revérifie dès que l'une d'elles change.
 * Limites: Ne récupère rien lui-même (le `reload` enregistré le fait, en silence) et ignore les sources non enregistrées ; l'enregistrement passe par `injectAutoRefresh`.
 */
@Injectable({ providedIn: 'root' })
export class RefreshService {
	private readonly browser = inject(BrowserService);
	private readonly mode = inject(UiFacade).refreshMode;
	private readonly entries = new Set<RefreshEntry>();
	private tabVisible = true;

	constructor() {
		timer(REFRESH_TICK_MS, REFRESH_TICK_MS)
			.pipe(takeUntilDestroyed(inject(DestroyRef)))
			.subscribe(() => this.check());
		this.browser.onVisibilityChange((visible) => {
			this.tabVisible = visible;
			this.check();
		});
	}

	/** Enregistre une source qui vient d'être chargée et renvoie la fonction qui la désenregistre. */
	public register(source: RefreshSourceModel): () => void {
		const now = Date.now();
		const entry: RefreshEntry = {
			...source,
			lastRunAt: now,
			lastRunDay: dayOf(now),
			visible: true,
			markRun(at: number): void {
				this.lastRunAt = at;
				this.lastRunDay = dayOf(at);
			},
		};
		const stopObserving = this.browser.observeIntersection(source.host, (visible) => {
			entry.visible = visible;
			if (visible) this.check();
		});
		this.entries.add(entry);
		return () => {
			stopObserving();
			this.entries.delete(entry);
		};
	}

	/** Recharge chaque source due et à l'écran ; appelé à chaque tick et quand la visibilité ou le réseau change. */
	public check(): void {
		if (!this.tabVisible || !this.browser.online) return;

		const now = Date.now();
		this.entries.forEach((entry) => {
			if (entry.visible && this.isDue(entry, now)) {
				entry.markRun(now);
				entry.reload();
			}
		});
	}

	private isDue(entry: RefreshEntry, now: number): boolean {
		if (entry.kind === RefreshKindEnum.DAY_BOUND && entry.lastRunDay !== dayOf(now)) return true;

		const interval = REFRESH_INTERVALS[this.mode()][entry.kind];
		return interval !== undefined && now - entry.lastRunAt >= interval;
	}
}
