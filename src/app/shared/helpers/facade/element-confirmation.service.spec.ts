import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ConfirmationModel } from '@shared/models/model/confirmation.model'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

describe( 'ElementConfirmationService', () => {
    let confirm: Mock<(confirmation: ConfirmationModel) => void>
    let service: ElementConfirmationService

    beforeEach( () => {
        confirm = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                { provide: UiFacade, useValue: { confirm } },
                { provide: TranslocoService, useValue: { translate: (key: string, params: { element: { name: string } }): string => `${key}:${params.element.name}` } },
            ],
        } )
        service = TestBed.inject( ElementConfirmationService )
    } )

    it( 'asks the UI for a confirmation built from the translations of the element', () => {
        // Arrange
        const accept: () => void = vi.fn()

        // Act
        service.confirm( 'users.actions.confirmations.delete', { name: 'Ada' }, SeverityEnum.DANGER, 'pi pi-trash', accept )

        // Assert
        expect( confirm ).toHaveBeenCalledWith( {
            header: 'users.actions.confirmations.delete.title:Ada',
            message: 'users.actions.confirmations.delete.message:Ada',
            icon: 'pi pi-trash',
            acceptSeverity: SeverityEnum.DANGER,
            accept,
        } )
    } )

    it('adds the phrase to type when the confirmation is a typed one', () => {
        // Arrange
        const accept: () => void = vi.fn()

        // Act
        service.confirm( 'users.actions.confirmations.delete', { name: 'Ada' }, SeverityEnum.DANGER, 'pi pi-trash', accept, true )

        // Assert
        expect( confirm.mock.calls[0][0].phrase ).toBe( 'users.actions.confirmations.delete.phrase:Ada' )
    } )
} )
