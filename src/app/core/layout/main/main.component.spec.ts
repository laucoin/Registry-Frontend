import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { MainComponent } from './main.component';

describe('MainComponent', () => {
	let fixture: ComponentFixture<MainComponent>;

	beforeEach(async () => {
		await MockBuilder(MainComponent);
		fixture = TestBed.createComponent(MainComponent);
		await fixture.whenStable();
	});

	it('should frame the routed page between the navbar and the footer', () => {
		// Arrange
		const host: HTMLElement = fixture.nativeElement;

		// Act
		const content: Element | null = host.querySelector('main#main-content');

		// Assert
		expect(host.querySelector('app-navbar')).not.toBeNull();
		expect(content?.querySelector('router-outlet')).not.toBeNull();
		expect(host.querySelector('app-footer')).not.toBeNull();
	});

	it('should move the focus to the content when the skip link is used', () => {
		// Arrange
		const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a[href="#main-content"]');
		const content: HTMLElement = fixture.nativeElement.querySelector('#main-content');
		document.body.appendChild(fixture.nativeElement);

		// Act
		link.click();

		// Assert
		expect(document.activeElement).toBe(content);
		fixture.nativeElement.remove();
	});
});
