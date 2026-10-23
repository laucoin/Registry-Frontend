import { describe, expect, it } from 'vitest'
import { AlertHelper } from '@shared/helpers/alert.helper'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { AlertModel } from '@shared/models/model/alert.model'

describe( 'AlertHelper', () => {
    it( 'labels a select item with the title and the formatted date', () => {
        // Arrange
        const alert: AlertModel = { id: 'al1', title: 'Fire', dateTime: new Date() } as AlertModel
        const datePipe: DateFormatPipe = { transform: (): string => '01/01 10:00' } as unknown as DateFormatPipe

        // Act
        const item: { label?: string } = AlertHelper.toSelectItem( alert, datePipe )

        // Assert
        expect( item.label ).toBe( 'Fire (01/01 10:00)' )
    } )

    it.each( [
        [ AlertStatusEnum.IN_PROGRESS, 'pi pi-exclamation-triangle', SeverityEnum.WARNING ],
        [ AlertStatusEnum.CANCELED, 'pi pi-times', SeverityEnum.SECONDARY ],
        [ AlertStatusEnum.RESOLVED, 'pi pi-check', SeverityEnum.SUCCESS ],
        [ undefined, 'pi pi-check', SeverityEnum.SUCCESS ],
    ] )( 'shows %s with the matching icon and severity', (status: AlertStatusEnum | undefined, icon: string, severity: SeverityEnum) => {
        // Arrange
        const current: AlertStatusEnum | undefined = status

        // Act
        const shownIcon: string = AlertHelper.getIconFromStatus( current )
        const shownSeverity: SeverityEnum = AlertHelper.getSeverityFromStatus( current )

        // Assert
        expect( shownIcon ).toBe( icon )
        expect( shownSeverity ).toBe( severity )
    } )
} )
