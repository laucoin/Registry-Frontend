import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideTransloco } from '@jsverse/transloco';

import { LoadMoreComponent } from './load-more.component';

describe('LoadMoreComponent', () => {
	let callback: IntersectionObserverCallback;
	let observe: ReturnType<typeof vi.fn>;
	let fixture: ComponentFixture<LoadMoreComponent>;
	let emitted: number;

	const intersect = (isIntersecting: boolean): void =>
		callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);

	beforeEach(async () => {
		observe = vi.fn();
		vi.stubGlobal(
			'IntersectionObserver',
			class {
				constructor(cb: IntersectionObserverCallback) {
					callback = cb;
				}
				public observe: ReturnType<typeof vi.fn> = observe;
				public unobserve: ReturnType<typeof vi.fn> = vi.fn();
				public disconnect: ReturnType<typeof vi.fn> = vi.fn();
			},
		);
		await TestBed.configureTestingModule({
			imports: [LoadMoreComponent],
			providers: [provideTransloco({ config: { availableLangs: ['fr'], defaultLang: 'fr' } })],
		}).compileComponents();
		fixture = TestBed.createComponent(LoadMoreComponent);
		fixture.componentRef.setInput('loadedCount', 20);
		fixture.componentRef.setInput('total', 50);
		emitted = 0;
		fixture.componentInstance.loadMore.subscribe(() => emitted++);
		fixture.detectChanges();
		await fixture.whenStable();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('asks for the next batch when the sentinel becomes visible', () => {
		// Arrange

		// Act
		intersect(true);

		// Assert
		expect(emitted).toBe(1);
	});

	it('does nothing when the sentinel is not visible', () => {
		// Arrange

		// Act
		intersect(false);

		// Assert
		expect(emitted).toBe(0);
	});

	it('does not ask while a batch is loading', async () => {
		// Arrange
		fixture.componentRef.setInput('loading', true);
		fixture.detectChanges();

		// Act
		intersect(true);

		// Assert
		expect(emitted).toBe(0);
	});

	it('does not ask when auto load is disabled', () => {
		// Arrange
		fixture.componentRef.setInput('autoLoad', false);
		fixture.detectChanges();

		// Act
		intersect(true);

		// Assert
		expect(emitted).toBe(0);
	});

	it('asks when the button is clicked even without auto load', () => {
		// Arrange
		fixture.componentRef.setInput('autoLoad', false);
		fixture.detectChanges();

		// Act
		fixture.nativeElement.querySelector('sgdf-button').click();

		// Assert
		expect(emitted).toBe(1);
	});
});
