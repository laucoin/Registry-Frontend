import { Provider, signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { BrowserService } from '@core/browser/browser.service'
import { ConfigModel } from '@core/config/model/config.model'
import { RegistryConfig } from '@core/config/registry.config'
import { NotificationStore } from '@core/registry/state/notification.store'
import { UiFacade } from '@core/registry/state/ui.facade'
import { TranslocoService } from '@jsverse/transloco'
import { ERROR_500, provideTestConfig } from '@shared/helpers/testing/test-fixtures'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'
import { ConfirmationModel } from '@shared/models/model/confirmation.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { Subject } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

describe('UiFacade', () => {
	let facade: UiFacade
	let received: NotificationModel[]
	let setRootTheme: Mock<(theme: ThemeEnum) => void>
	let reload: Mock<() => void>
	let systemTheme: WritableSignal<ThemeEnum>
	let resize: (width: number) => void

	function provideBrowser(): Provider {
		return {
			provide: BrowserService,
			useValue: {
				get systemTheme(): ThemeEnum { return systemTheme() },
				viewportWidth: 1280,
				onViewportResize: (listener: (width: number) => void): (() => void) => { resize = listener; return (): void => undefined },
				setRootTheme,
				readCookie: (): undefined => undefined,
				writeCookie: vi.fn(),
				reload,
				setRootLanguage: vi.fn(),
			},
		}
	}

	function provideTransloco(): Provider {
		return {
			provide: TranslocoService,
			useValue: {
				translate: (key: string): string => `t:${key}`,
				langChanges$: new Subject<string>().asObservable(),
			},
		}
	}

	function configureConfig(): void {
		provideTestConfig()
		RegistryConfig.config = {
			...RegistryConfig.config,
			logo: {
				small: { light: 'small-light.svg', dark: 'small-dark.svg' },
				normal: { light: 'light.svg', dark: 'dark.svg' },
			},
		} as unknown as ConfigModel
	}

	beforeEach(() => {
		configureConfig()
		setRootTheme = vi.fn()
		reload = vi.fn()
		systemTheme = signal(ThemeEnum.LIGHT)
		TestBed.configureTestingModule({ providers: [UiFacade, provideBrowser(), provideTransloco()] })
		facade = TestBed.inject(UiFacade)
		received = []
		TestBed.inject(NotificationStore).messages$().subscribe((message: NotificationModel): number => received.push(message))
	})

	it('considers screens narrower than 768 pixels tiny', () => {
		// Arrange
		resize(767)
		const tiny: boolean = facade.tinyScreen()

		// Act
		resize(768)

		// Assert
		expect(tiny).toBe(true)
		expect(facade.tinyScreen()).toBe(false)
	})

	it('reloads the application', () => {
		// Arrange
		const expectedCalls: number = 1

		// Act
		facade.reloadApplication()

		// Assert
		expect(reload).toHaveBeenCalledTimes(expectedCalls)
	})

	it('ignores an undefined theme and applies a defined one', () => {
		// Arrange
		facade.updateTheme(undefined)
		const untouched: number = setRootTheme.mock.calls.length

		// Act
		facade.updateTheme(ThemeEnum.DARK)

		// Assert
		expect(untouched).toBe(0)
		expect(setRootTheme).toHaveBeenCalledWith(ThemeEnum.DARK)
		expect(facade.theme()).toBe(ThemeEnum.DARK)
	})

	it('does not announce the first network state but announces the following changes', () => {
		// Arrange
		facade.updateNetwork(true)
		const afterFirst: number = received.length

		// Act
		facade.updateNetwork(false)
		facade.updateNetwork(true)

		// Assert
		expect(afterFirst).toBe(0)
		expect(received.map((message: NotificationModel): string | undefined => message.summary)).toEqual([
			'global.notifications.OFFLINE.title',
			'global.notifications.ONLINE.title',
		])
	})

	it('swallows the notifications of an unauthorized call', () => {
		// Arrange
		const message: NotificationModel = { summary: 'error 401', detail: 'x' }

		// Act
		facade.notify(message)

		// Assert
		expect(received).toEqual([])
	})

	it('fills an empty notification with the unknown error title and detail', () => {
		// Arrange
		const message: NotificationModel = { severity: 'error', summary: ' ', detail: '' }

		// Act
		facade.notify(message)

		// Assert
		expect(received[0].summary).toBe('t:global.notifications.UNKNOWN_ERROR.title')
		expect(received[0].detail).toBe('t:global.notifications.UNKNOWN_ERROR.message')
	})

	it('forwards a normal notification as it is', () => {
		// Arrange
		const message: NotificationModel = { severity: 'success', summary: 'Done', detail: 'ok' }

		// Act
		facade.notify(message)

		// Assert
		expect(received).toEqual([message])
	})

	it('exposes the global error', () => {
		// Arrange
		// Act
		facade.setGlobalError(ERROR_500)

		// Assert
		expect(facade.globalError()?.summary).toBe('Title')
	})

	it('exposes the language being saved', () => {
		// Arrange
		facade.startLanguageChange('en')
		const pending: string | undefined = facade.pendingLanguage()

		// Act
		facade.stopLanguageChange()

		// Assert
		expect(pending).toBe('en')
		expect(facade.pendingLanguage()).toBeUndefined()
	})

	it('forwards a confirmation request to the listeners of the confirmation stream', () => {
		// Arrange
		const requested: ConfirmationModel[] = []
		const confirmation: ConfirmationModel = {
			header: 'h',
			message: 'm',
			acceptSeverity: SeverityEnum.WARNING,
			accept: (): void => undefined
		}
		facade.confirmation.subscribe((it: ConfirmationModel): number => requested.push(it))

		// Act
		facade.confirm(confirmation)

		// Assert
		expect(requested).toEqual([confirmation])
	})
})
