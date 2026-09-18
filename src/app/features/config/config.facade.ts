import { computed, inject, Injectable, Signal } from '@angular/core';
import { ConfigStore } from '@features/config/config.store';
import { RuntimeConfigModel } from '@features/config/runtime-config.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConfigFacade {
	private readonly store: InstanceType<typeof ConfigStore> = inject(ConfigStore);

	public readonly config: Signal<RuntimeConfigModel | undefined> = this.store.config;

	public readonly organization: Signal<RuntimeConfigModel['organization'] | undefined> = computed(
		() => this.store.config()?.organization,
	);

	public readonly creator: Signal<RuntimeConfigModel['creator'] | undefined> = computed(
		() => this.store.config()?.creator,
	);

	public readonly hosting: Signal<RuntimeConfigModel['hosting'] | undefined> = computed(
		() => this.store.config()?.hosting,
	);

	public readonly support: Signal<RuntimeConfigModel['support'] | undefined> = computed(
		() => this.store.config()?.support,
	);

	public load(): Observable<RuntimeConfigModel> {
		return this.store.load();
	}
}
