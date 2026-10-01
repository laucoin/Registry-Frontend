import { Component, inject, Signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalErrorFacade } from '@core/error/global-error.facade';
import { GlobalErrorOverlayComponent } from '@core/error/global-error-overlay/global-error-overlay.component';

@Component({
	imports: [RouterOutlet, GlobalErrorOverlayComponent],
	selector: 'app-root',
	templateUrl: './registry.component.html',
})
/**
 * Purpose: Application root component — hosts the router outlet, or the global error overlay in its
 * place when GlobalErrorFacade reports an unrecoverable startup failure.
 * Scope: Pure composition; no logic of its own beyond reading GlobalErrorFacade.visible.
 * Limits: The outlet is fully hidden (not layered under the overlay) so that no routed component's
 * config-dependent code can run while the app is in this state.
 */
export class RegistryComponent {
	private readonly _globalErrorFacade: GlobalErrorFacade = inject(GlobalErrorFacade);

	protected readonly globalErrorVisible: Signal<boolean> = this._globalErrorFacade.visible;
}
