import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { RegistryConfig } from '@core/config/registry.config';
import { SessionFacade } from '@core/registry/state/session.facade';
import { MockBuilder, ngMocks } from 'ng-mocks';
import { AccountPersonalDataComponent } from './account-personal-data.component';

describe('AccountPersonalDataComponent', () => {
	let fixture: ComponentFixture<AccountPersonalDataComponent>;

	beforeEach(async () => {
		RegistryConfig.config = { application: { organization: 'SGDF' } } as typeof RegistryConfig.config;
		await MockBuilder(AccountPersonalDataComponent)
			.mock(TranslocoPipe, (key: string): string => key)
			.mock(SessionFacade);
		fixture = TestBed.createComponent(AccountPersonalDataComponent);
		await fixture.whenStable();
	});

	it('should link to the privacy page', () => {
		// Arrange
		const link: DebugElement = fixture.debugElement.query(By.css('a'));

		// Act
		const href: string = ngMocks.get(link, RouterLink).routerLink as string;

		// Assert
		expect(href).toBe('/privacy');
	});

	it('should offer the data extract and the account deletion', () => {
		// Arrange
		const expected: number = 2;

		// Act
		const buttons: number = fixture.nativeElement.querySelectorAll('sgdf-table sgdf-button').length;

		// Assert
		expect(buttons).toBe(expected);
	});

	it('should export the account data when the extract button is clicked', () => {
		// Arrange
		const exportAccount: ReturnType<typeof vi.spyOn> = vi.spyOn(TestBed.inject(SessionFacade), 'exportAccount').mockImplementation(() => undefined);
		const button: HTMLElement = fixture.nativeElement.querySelectorAll('sgdf-table sgdf-button')[0];

		// Act
		button.click();

		// Assert
		expect(exportAccount).toHaveBeenCalledOnce();
	});

	it('should enable both personal data buttons', () => {
		// Arrange
		const buttons: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('sgdf-table sgdf-button'));

		// Act
		const disabled: boolean[] = buttons.map((button: HTMLElement): boolean => button.hasAttribute('disabled'));

		// Assert
		expect(disabled).toEqual([false, false]);
	});

	it('should open the confirmation dialog without deleting when the delete button is clicked', () => {
		// Arrange
		const deleteAccount: ReturnType<typeof vi.spyOn> = vi.spyOn(TestBed.inject(SessionFacade), 'deleteAccount').mockImplementation(() => undefined);
		const dialog: HTMLElement = fixture.nativeElement.querySelector('sgdf-dialog');
		const button: HTMLElement = fixture.nativeElement.querySelectorAll('sgdf-table sgdf-button')[1];

		// Act
		button.click();
		fixture.detectChanges();

		// Assert
		expect((dialog as HTMLElement & { open: boolean }).open).toBe(true);
		expect(deleteAccount).not.toHaveBeenCalled();
	});

	it('should keep the deletion disabled until the confirmation phrase is typed', () => {
		// Arrange
		const deleteAccount: ReturnType<typeof vi.spyOn> = vi.spyOn(TestBed.inject(SessionFacade), 'deleteAccount').mockImplementation(() => undefined);
		const dialog: HTMLElement = fixture.nativeElement.querySelector('sgdf-dialog');
		fixture.nativeElement.querySelectorAll('sgdf-table sgdf-button')[1].click();
		fixture.detectChanges();
		const confirm: HTMLElement = dialog.querySelectorAll<HTMLElement>('sgdf-button')[1];
		const input: HTMLElement & { value: unknown } = dialog.querySelector('sgdf-input')!;

		// Act
		const disabledBefore: boolean = (confirm as HTMLElement & { disabled: boolean }).disabled;
		input.value = 'myAccount.personalData.delete.confirmation.phrase';
		input.dispatchEvent(new Event('input'));
		fixture.detectChanges();
		const disabledAfter: boolean = (confirm as HTMLElement & { disabled: boolean }).disabled;

		// Assert
		expect(disabledBefore).toBe(true);
		expect(disabledAfter).toBe(false);
		expect(deleteAccount).not.toHaveBeenCalled();
	});

	it('should delete the account and close the dialog when the phrase is typed and the deletion confirmed', async () => {
		// Arrange
		const deleteAccount: ReturnType<typeof vi.spyOn> = vi.spyOn(TestBed.inject(SessionFacade), 'deleteAccount').mockImplementation(() => undefined);
		const dialog: HTMLElement = fixture.nativeElement.querySelector('sgdf-dialog');
		fixture.nativeElement.querySelectorAll('sgdf-table sgdf-button')[1].click();
		fixture.detectChanges();
		const input: HTMLElement & { value: unknown } = dialog.querySelector('sgdf-input')!;
		input.value = '  Myaccount.personalData.delete.confirmation.phrase ';
		input.dispatchEvent(new Event('input'));
		fixture.detectChanges();
		await fixture.whenStable();
		await new Promise<void>((resolve: () => void): void => { setTimeout(resolve) });

		// Act
		dialog.querySelectorAll<HTMLElement>('sgdf-button')[1].click();
		fixture.detectChanges();

		// Assert
		expect(deleteAccount).toHaveBeenCalledOnce();
		expect((dialog as HTMLElement & { open: boolean }).open).toBe(false);
	});

	it('should close the dialog without deleting when the deletion is cancelled', () => {
		// Arrange
		const deleteAccount: ReturnType<typeof vi.spyOn> = vi.spyOn(TestBed.inject(SessionFacade), 'deleteAccount').mockImplementation(() => undefined);
		const dialog: HTMLElement = fixture.nativeElement.querySelector('sgdf-dialog');
		fixture.nativeElement.querySelectorAll('sgdf-table sgdf-button')[1].click();
		fixture.detectChanges();

		// Act
		dialog.querySelectorAll<HTMLElement>('sgdf-button')[0].click();
		fixture.detectChanges();

		// Assert
		expect(deleteAccount).not.toHaveBeenCalled();
		expect((dialog as HTMLElement & { open: boolean }).open).toBe(false);
	});

	it('should title the section with a level two heading', () => {
		// Arrange
		const heading: HTMLElement = fixture.nativeElement.querySelector('sgdf-table-cell[header] > h2');

		// Act
		const title: string = heading.textContent!.trim();

		// Assert
		expect(title).toBe('myAccount.personalData.title');
	});
});
