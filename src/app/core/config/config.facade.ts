import { computed, inject, Injectable, Signal } from '@angular/core';
import { ConfigStore } from '@core/config/config.store';
import { RuntimeConfigModel } from '@shared/models/runtime-config.model';
import { Observable } from 'rxjs';

/**
 * Purpose: Sole public entry point for the runtime-config domain — exposes the loaded config and its sub-sections.
 * Scope: Forwards state as signals off ConfigStore and forwards load() to it; called once at app init.
 * Limits: Implements no HTTP or state logic itself; only orchestrates ConfigStore.
 */
@Injectable({ providedIn: 'root' })
export class ConfigFacade {
	private readonly _store: InstanceType<typeof ConfigStore> = inject(ConfigStore);

	public readonly config: Signal<RuntimeConfigModel | undefined> = this._store.config;

	public readonly organization: Signal<RuntimeConfigModel['organization'] | undefined> = computed(
		() => this._store.config()?.organization,
	);

	public readonly creator: Signal<RuntimeConfigModel['creator'] | undefined> = computed(
		() => this._store.config()?.creator,
	);

	public readonly hosting: Signal<RuntimeConfigModel['hosting'] | undefined> = computed(
		() => this._store.config()?.hosting,
	);

	public readonly support: Signal<RuntimeConfigModel['support'] | undefined> = computed(
		() => this._store.config()?.support,
	);

	public load(): Observable<RuntimeConfigModel> {
		return this._store.load();
	}
}
