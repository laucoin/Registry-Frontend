import { inject } from '@angular/core';
import { ConfigApi } from '@core/config/config.api';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { RuntimeConfigModel } from '@shared/models/runtime-config.model';
import { Observable, tap } from 'rxjs';

interface ConfigState {
	config: RuntimeConfigModel | undefined;
}

const initialState: ConfigState = {
	config: undefined,
};

/**
 * Purpose: Holds the shared, app-wide runtime-config state, loaded once from the backend.
 * Scope: Calls ConfigApi and persists the result; consumed app-wide (theming, backend URLs, org info).
 * Limits: Never injected directly outside ConfigFacade.
 */
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
