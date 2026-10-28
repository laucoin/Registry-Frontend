import { signal, WritableSignal } from '@angular/core'
import type { Mock } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { BrowserService } from '@core/browser/browser.service'
import { UiFacade } from '@core/registry/state/ui.facade'
import { REFRESH_TICK_MS } from '@shared/helpers/refresh/refresh.config'
import { RefreshService } from '@shared/helpers/refresh/refresh.service'
import { RefreshModeEnum } from '@shared/models/enumeration/refresh-mode.enum'

describe( 'RefreshService', () => {
	let service: RefreshService
	let mode: WritableSignal<RefreshModeEnum>
	let online: boolean
	let visibilityListener: (visible: boolean) => void
	let intersectionListener: (visible: boolean) => void
	const host: Element = document.createElement( 'div' )

	beforeEach( () => {
		vi.useFakeTimers()
		vi.setSystemTime( new Date( 2026, 9, 20, 10, 0, 0 ) )
		mode = signal( RefreshModeEnum.NORMAL )
		online = true
		TestBed.configureTestingModule( {
			providers: [
				{ provide: UiFacade, useValue: { refreshMode: mode } },
				{
					provide: BrowserService,
					useValue: {
						get online (): boolean { return online },
						observeIntersection: (_element: Element, listener: (visible: boolean) => void): (() => void) => {
							intersectionListener = listener
							return (): void => undefined
						},
						onVisibilityChange: (listener: (visible: boolean) => void): (() => void) => {
							visibilityListener = listener
							return (): void => undefined
						},
					},
				},
			],
		} )
		service = TestBed.inject( RefreshService )
	} )

	afterEach( () => vi.useRealTimers() )

	it( 'should reload a live source once its interval has elapsed', () => {
		// Arrange
		const reload: Mock<() => void> = vi.fn<() => void>()
		service.register( { key: 'a', kind: 'live', reload, host } )

		// Act
		vi.advanceTimersByTime( 59_000 )
		const early: number = reload.mock.calls.length
		vi.advanceTimersByTime( REFRESH_TICK_MS )

		// Assert
		expect( early ).toBe( 0 )
		expect( reload ).toHaveBeenCalledTimes( 1 )
	} )

	it( 'should not reload anything when the mode is off', () => {
		// Arrange
		mode.set( RefreshModeEnum.OFF )
		const reload: Mock<() => void> = vi.fn<() => void>()
		service.register( { key: 'a', kind: 'live', reload, host } )

		// Act
		vi.advanceTimersByTime( 10 * 60_000 )

		// Assert
		expect( reload ).not.toHaveBeenCalled()
	} )

	it( 'should skip a source that is off screen and reload it as soon as it is visible', () => {
		// Arrange
		const reload: Mock<() => void> = vi.fn<() => void>()
		service.register( { key: 'a', kind: 'live', reload, host } )
		intersectionListener( false )

		// Act
		vi.advanceTimersByTime( 5 * 60_000 )
		const whileHidden: number = reload.mock.calls.length
		intersectionListener( true )

		// Assert
		expect( whileHidden ).toBe( 0 )
		expect( reload ).toHaveBeenCalledTimes( 1 )
	} )

	it( 'should pause while the tab is hidden or offline and catch up afterwards', () => {
		// Arrange
		const reload: Mock<() => void> = vi.fn<() => void>()
		service.register( { key: 'a', kind: 'live', reload, host } )
		visibilityListener( false )
		vi.advanceTimersByTime( 5 * 60_000 )
		const whileHidden: number = reload.mock.calls.length

		// Act
		visibilityListener( true )

		// Assert
		expect( whileHidden ).toBe( 0 )
		expect( reload ).toHaveBeenCalledTimes( 1 )
	} )

	it( 'should reload day-bound data at the change of day only', () => {
		// Arrange
		const reload: Mock<() => void> = vi.fn<() => void>()
		service.register( { key: 'a', kind: 'dayBound', reload, host } )

		// Act
		vi.advanceTimersByTime( 13 * 60 * 60_000 )
		const sameDay: number = reload.mock.calls.length
		vi.advanceTimersByTime( 2 * 60 * 60_000 )

		// Assert
		expect( sameDay ).toBe( 0 )
		expect( reload ).toHaveBeenCalledTimes( 1 )
	} )

	it( 'should stop reloading a source once unregistered', () => {
		// Arrange
		const reload: Mock<() => void> = vi.fn<() => void>()
		const unregister: () => void = service.register( { key: 'a', kind: 'live', reload, host } )

		// Act
		unregister()
		vi.advanceTimersByTime( 10 * 60_000 )

		// Assert
		expect( reload ).not.toHaveBeenCalled()
	} )
} )
