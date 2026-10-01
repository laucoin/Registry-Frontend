import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

export type GlobalErrorReason = 'CONFIG_LOAD_FAILED' | 'SESSION_CHECK_FAILED' | 'TOKEN_EXCHANGE_FAILED';

interface GlobalErrorState {
	visible: boolean;
	reason: GlobalErrorReason | null;
}

const initialState: GlobalErrorState = {
	visible: false,
	reason: null,
};

/**
 * Purpose: Holds the app-wide "unrecoverable startup failure" state (backend unreachable, current-user
 * fetch failing for a reason other than being logged out, or the OAuth callback exchange failing).
 * Scope: A one-way flag set by app.config.ts's initializer and AuthStore; there is no dismiss() — the
 * only way out of this state is a page reload, since these failures mean nothing else in the app works.
 * Limits: Never injected directly outside GlobalErrorFacade.
 */
export const GlobalErrorStore = signalStore(
	{ providedIn: 'root' },
	withState(initialState),
	withMethods((store) => ({
		show(reason: GlobalErrorReason): void {
			patchState(store, { visible: true, reason });
		},
	})),
);
