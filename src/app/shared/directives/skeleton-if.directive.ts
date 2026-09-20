import {
	ComponentRef,
	Directive,
	effect,
	inject,
	input,
	InputSignal,
	Renderer2,
	TemplateRef,
	ViewContainerRef,
} from '@angular/core';
import { NzSkeletonComponent } from 'ng-zorro-antd/skeleton';

type SkeletonIfView = 'content' | 'skeleton';

@Directive({
	selector: '[appSkeletonIf]',
})
/**
 * Purpose: Structural directive that swaps its host template for a loading skeleton while a bound value is empty.
 * Scope: Toggles between the embedded template and a dynamically created `NzSkeletonComponent`; width is configurable.
 * Limits: Treats `null`/`undefined`/`''` as "no value" — anything else (including `0` or `false`) counts as loaded.
 */
export class SkeletonIfDirective {
	private readonly _templateRef: TemplateRef<unknown> = inject(TemplateRef<unknown>);
	private readonly _viewContainerRef: ViewContainerRef = inject(ViewContainerRef);
	private readonly _renderer: Renderer2 = inject(Renderer2);
	private _renderedView: SkeletonIfView | null = null;

	public readonly appSkeletonIf: InputSignal<unknown> = input.required<unknown>();
	public readonly appSkeletonIfWidth: InputSignal<string> = input<string>('6rem');

	public constructor() {
		effect(() => this._render(this._hasValue(this.appSkeletonIf()) ? 'content' : 'skeleton'));
	}

	private _hasValue(value: unknown): boolean {
		return value !== null && value !== undefined && value !== '';
	}

	private _render(view: SkeletonIfView): void {
		if (view === this._renderedView) {
			return;
		}

		this._viewContainerRef.clear();

		if (view === 'content') {
			this._viewContainerRef.createEmbeddedView(this._templateRef);
		} else {
			this._createSkeleton();
		}

		this._renderedView = view;
	}

	private _createSkeleton(): void {
		const componentRef: ComponentRef<NzSkeletonComponent> =
			this._viewContainerRef.createComponent(NzSkeletonComponent);

		componentRef.setInput('nzActive', true);
		componentRef.setInput('nzTitle', false);
		componentRef.setInput('nzAvatar', false);
		componentRef.setInput('nzParagraph', { rows: 1, width: '100%' });

		this._renderer.setStyle(
			componentRef.location.nativeElement,
			'width',
			this.appSkeletonIfWidth(),
		);
	}
}
