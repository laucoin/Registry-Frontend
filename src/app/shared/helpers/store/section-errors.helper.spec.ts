import { Signal, signal, WritableSignal } from '@angular/core'
import { describe, expect, it } from 'vitest'
import { SectionErrorsHelper } from '@shared/helpers/store/section-errors.helper'
import { NotificationModel } from '@shared/models/model/notification.model'

describe( 'SectionErrorsHelper', () => {
    const failure: NotificationModel = { summary: 'Title', detail: 'Message' }

    it( 'reads the error of one section and follows its changes', () => {
        // Arrange
        const errors: WritableSignal<Record<string, NotificationModel | undefined>> = signal( {} )
        const error: Signal<NotificationModel | undefined> = SectionErrorsHelper.of( errors, 'contents' )

        // Act
        errors.set( { contents: failure } )

        // Assert
        expect( error() ).toBe( failure )
    } )

    it( 'keys the metadata errors by field and leaves out the other sections and the cleared ones', () => {
        // Arrange
        const errors: WritableSignal<Record<string, NotificationModel | undefined>> = signal( {
            'metadata.status': failure,
            'metadata.roles': undefined,
            contents: failure,
        } )

        // Act
        const metadata: Signal<Record<string, NotificationModel | undefined>> = SectionErrorsHelper.metadata( errors )

        // Assert
        expect( metadata() ).toEqual( { status: failure } )
    } )
} )
