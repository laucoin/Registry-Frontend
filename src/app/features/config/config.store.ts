import { inject } from '@angular/core';
import { ConfigApi } from '@features/config/config.api';
import { RuntimeConfigModel } from '@features/config/runtime-config.model';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Observable, tap } from 'rxjs';

interface ConfigState {
	config: RuntimeConfigModel | undefined;
}

const initialState: ConfigState = {
	config: undefined,
};

export const ConfigStore = signalStore(
	{ providedIn: 'root' },
	withState(initialState),
	withMethods((store) => {
		const configApi: ConfigApi = inject(ConfigApi);

		return {
			load(): Observable<RuntimeConfigModel> {
				return configApi
					.fetch()
					.pipe(tap((config: RuntimeConfigModel): void => patchState(store, { config })));
			},
		};
	}),
);
