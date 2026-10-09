import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { NotificationModel } from '@shared/models/model/notification.model'
import { beforeEach, describe, expect, it } from 'vitest'
import { BrowserService } from '@core/browser/browser.service'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { NotificationStore } from '@core/registry/state/notification.store'
import { UiStore } from '@core/registry/state/ui.store'
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'

describe( 'ErrorReporter', () => {
    let reporter: ErrorReporter

    beforeEach( () => {
        TestBed.configureTestingModule( {
            providers: [
                { provide: BrowserService, useValue: { systemTheme: ThemeEnum.LIGHT, viewportWidth: 1024, setRootTheme: (): void => undefined, setRootLanguage: (): void => undefined } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        } )
        reporter = TestBed.inject( ErrorReporter )
    } )

    it( 'turns a global error into the global error state of the UI', () => {
        // Arrange
        const ui: InstanceType<typeof UiStore> = TestBed.inject( UiStore )

        // Act
        reporter.setGlobalError( ERROR_500 )

        // Assert
        expect( ui.error()?.summary ).toBe( 'Title' )
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
