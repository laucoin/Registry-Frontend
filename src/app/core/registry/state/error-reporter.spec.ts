import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { NotificationModel } from '@shared/models/model/notification.model'
import { beforeEach, describe, expect, it } from 'vitest'
import { BrowserService } from '@core/browser/browser.service'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { NotificationStore } from '@core/registry/state/notification.store'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'

describe( 'ErrorReporter', () => {
    let reporter: ErrorReporter

    beforeEach( () => {
        TestBed.configureTestingModule( {
            providers: [
                { provide: BrowserService, useValue: { systemTheme: ThemeEnum.LIGHT, viewportWidth: 1024, onViewportResize: (): void => undefined, setRootTheme: (): void => undefined, readCookie: (): undefined => undefined, writeCookie: (): void => undefined, setRootLanguage: (): void => undefined } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        } )
        reporter = TestBed.inject( ErrorReporter )
    } )

    it( 'relays a notification to the toast', () => {
        // Arrange
        const received: NotificationModel[] = []
        TestBed.inject( NotificationStore ).messages$().subscribe( (message: NotificationModel): number => received.push( message ) )

        // Act
        reporter.notify( { severity: 'info', summary: 'Hello', detail: 'there' } )

        // Assert
        expect( received ).toHaveLength( 1 )
        expect( received[ 0 ].summary ).toBe( 'Hello' )
    } )
} )
