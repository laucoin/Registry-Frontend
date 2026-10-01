import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, Signal } from '@angular/core';
import { GlobalErrorReason, GlobalErrorStore } from '@core/error/global-error.store';

/**
 * Purpose: Sole public entry point for reporting/reading the app-wide "unrecoverable startup failure" state.
 * Scope: Exposes GlobalErrorStore's state as signals, forwards each failure report to it, and reloads the
 * page as the only available recovery action.
 * Limits: Implements no state logic itself; only orchestrates GlobalErrorStore.
 */
@Injectable({ providedIn: 'root' })
export class GlobalErrorFacade {
	private readonly _store: InstanceType<typeof GlobalErrorStore> = inject(GlobalErrorStore);
	private readonly _isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));

	public readonly visible: Signal<boolean> = this._store.visible;
	public readonly reason: Signal<GlobalErrorReason | null> = this._store.reason;

	public reportConfigLoadFailure(): void {
		this._store.show('CONFIG_LOAD_FAILED');
	}

	public reportSessionCheckFailure(): void {
		this._store.show('SESSION_CHECK_FAILED');
	}

	public reportTokenExchangeFailure(): void {
		this._store.show('TOKEN_EXCHANGE_FAILED');
	}

	public retry(): void {
		if (this._isBrowser) {
			window.location.reload();
		}
	}
}
