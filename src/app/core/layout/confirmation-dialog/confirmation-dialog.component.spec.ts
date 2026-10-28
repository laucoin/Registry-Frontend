import { TestBed } from '@angular/core/testing'
import { Subject } from 'rxjs'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfirmationDialogComponent } from '@core/layout/confirmation-dialog/confirmation-dialog.component'
import { UiFacade } from '@core/registry/state/ui.facade'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ConfirmationModel } from '@shared/models/model/confirmation.model'

interface DialogApi {
	pending: () => ConfirmationModel | undefined
	variant: () => string
	confirm: () => void
	cancel: (event?: Event) => void
	onInput: (event: Event) => void
	phraseTyped: () => boolean
	typed: () => string
}

describe('ConfirmationDialogComponent', () => {
	let requests: Subject<ConfirmationModel>
	let accept: Mock<() => void>

	const request = (acceptSeverity: SeverityEnum): ConfirmationModel => ({ header: 'Delete', message: 'Sure?', acceptSeverity, accept })

	function create(): DialogApi {
		TestBed.configureTestingModule({ providers: [{ provide: UiFacade, useValue: { confirmation: requests.asObservable() } }] })
		TestBed.overrideComponent(ConfirmationDialogComponent, { set: { template: '', imports: [] } })
		return TestBed.createComponent(ConfirmationDialogComponent).componentInstance as unknown as DialogApi
	}

	beforeEach(() => {
		TestBed.resetTestingModule()
		requests = new Subject<ConfirmationModel>()
		accept = vi.fn()
	})

	it('stays closed until a confirmation is requested, then shows it', () => {
		// Arrange
		const dialog: DialogApi = create()
		const before: ConfirmationModel | undefined = dialog.pending()

		// Act
		requests.next(request(SeverityEnum.DANGER))

		// Assert
		expect(before).toBeUndefined()
		expect(dialog.pending()?.header).toBe('Delete')
	})

	it.each([
		[SeverityEnum.DANGER, 'danger'],
		[SeverityEnum.WARNING, 'warning'],
		[SeverityEnum.INFO, 'info'],
		[SeverityEnum.PRIMARY, 'primary'],
	])('colors the dialog of a %s confirmation as %s', (severity: SeverityEnum, expected: string) => {
		// Arrange
		const dialog: DialogApi = create()

		// Act
		requests.next(request(severity))

		// Assert
		expect(dialog.variant()).toBe(expected)
	})

	it('runs the command and closes when the user confirms', () => {
		// Arrange
		const dialog: DialogApi = create()
		requests.next(request(SeverityEnum.DANGER))

		// Act
		dialog.confirm()

		// Assert
		expect(accept).toHaveBeenCalledTimes(1)
		expect(dialog.pending()).toBeUndefined()
	})

	it('replaces the pending confirmation by a new one without running the first', () => {
		// Arrange
		const dialog: DialogApi = create()
		const first: Mock<() => void> = vi.fn()
		requests.next({ ...request(SeverityEnum.DANGER), header: 'First', accept: first })

		// Act
		requests.next({ ...request(SeverityEnum.INFO), header: 'Second' })
		dialog.confirm()

		// Assert
		expect(first).not.toHaveBeenCalled()
		expect(accept).toHaveBeenCalledTimes(1)
	})

	it('closes without running the command when the user cancels', () => {
		// Arrange
		const dialog: DialogApi = create()
		requests.next(request(SeverityEnum.DANGER))

		// Act
		dialog.cancel()

		// Assert
		expect(accept).not.toHaveBeenCalled()
		expect(dialog.pending()).toBeUndefined()
	})

	const typing = (value: string): Event => ({ target: { value } }) as unknown as Event

	it('needs no phrase to confirm a plain confirmation', () => {
		// Arrange
		const dialog: DialogApi = create()

		// Act
		requests.next(request(SeverityEnum.DANGER))

		// Assert
		expect(dialog.phraseTyped()).toBe(true)
	})

	it('refuses to confirm a typed confirmation until its phrase is typed, whatever the case', () => {
		// Arrange
		const dialog: DialogApi = create()
		requests.next({ ...request(SeverityEnum.DANGER), phrase: 'delete mine' })

		// Act
		dialog.confirm()
		const before: boolean = dialog.phraseTyped()
		dialog.onInput(typing('  Delete Mine '))
		dialog.confirm()

		// Assert
		expect(before).toBe(false)
		expect(accept).toHaveBeenCalledTimes(1)
		expect(dialog.pending()).toBeUndefined()
	})

	it('forgets what was typed when the confirmation is replaced or closed', () => {
		// Arrange
		const dialog: DialogApi = create()
		requests.next({ ...request(SeverityEnum.DANGER), phrase: 'delete mine' })
		dialog.onInput(typing('delete'))

		// Act
		requests.next({ ...request(SeverityEnum.DANGER), phrase: 'delete mine' })
		const afterReplace: string = dialog.typed()
		dialog.onInput(typing('delete'))
		dialog.cancel()

		// Assert
		expect(afterReplace).toBe('')
		expect(dialog.typed()).toBe('')
	})

	it('ignores a hide event raised by an element nested in the dialog', () => {
		// Arrange
		const dialog: DialogApi = create()
		requests.next(request(SeverityEnum.DANGER))
		const nested: Event = { target: {}, currentTarget: {} } as unknown as Event

		// Act
		dialog.cancel(nested)

		// Assert
		expect(dialog.pending()).toBeDefined()
	})
})
