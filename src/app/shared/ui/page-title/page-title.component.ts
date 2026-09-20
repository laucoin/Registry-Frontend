import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { NavigationHistoryService } from '@core/navigation/navigation-history.service';
import { LucideArrowLeft } from '@lucide/angular';
import { StringHelper } from '@shared/helpers/string.helper';

@Component({
	imports: [LucideArrowLeft],
	selector: 'app-page-title',
	styleUrl: './page-title.component.less',
	templateUrl: './page-title.component.html',
})
/**
 * Purpose: Reusable page header — eyebrow, title, optional lede, and an optional back button.
 * Scope: Pure presentational component with one side effect: the back button delegates to NavigationHistoryService.
 * Limits: The back button only renders when `backButtonLabel` is provided.
 */
export class PageTitleComponent {
	private readonly _navigationHistory: NavigationHistoryService = inject(NavigationHistoryService);

	public readonly eyebrow: InputSignal<string> = input.required<string>();
	public readonly title: InputSignal<string> = input.required<string>();
	public readonly lede: InputSignal<string | undefined> = input<string | undefined>(undefined);
	public readonly backButtonLabel: InputSignal<string | undefined> = input<string | undefined>(
		undefined,
	);
	public readonly backFallbackUrl: InputSignal<string> = input<string>('/');
	protected readonly showBackButton: Signal<boolean> = computed(() =>
		StringHelper.isNotBlank(this.backButtonLabel()),
	);

	protected onBackButtonClick(): void {
		this._navigationHistory.goBack(this.backFallbackUrl());
	}
}
