import { describe, expect, it } from 'vitest'
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe'
import { FormIconPipe } from '@shared/helpers/pipe/form-icon.pipe'
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe'
import { ProjectOptionIconPipe } from '@shared/helpers/pipe/project-option-icon.pipe'
import { TruncatePipe } from '@shared/helpers/pipe/truncate.pipe'
import { VisibilityNamePipe } from '@shared/helpers/pipe/visibility.pipe'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { GenericModel } from '@shared/models/model/generic.model'

describe( 'FormButtonPipe', () => {
    it( 'offers to edit an existing element and to create a new one', () => {
        // Arrange
        const pipe: FormButtonPipe = new FormButtonPipe()

        // Act
        const editing: string = pipe.transform( { id: '1' } )
        const creating: string = pipe.transform( undefined )

        // Assert
        expect( editing ).toBe( 'global.actions.edit' )
        expect( creating ).toBe( 'global.actions.create' )
    } )
} )

describe( 'FormIconPipe', () => {
    it( 'shows a pen for an existing element and a plus for a new one', () => {
        // Arrange
        const pipe: FormIconPipe = new FormIconPipe()

        // Act
        const editing: string = pipe.transform( { id: '1' } )
        const creating: string = pipe.transform( undefined )

        // Assert
        expect( editing ).toBe( 'pi pi-pen-to-square' )
        expect( creating ).toBe( 'pi pi-plus' )
    } )
} )

describe( 'FormTitlePipe', () => {
    it( 'suffixes the title key with edit or create', () => {
        // Arrange
        const pipe: FormTitlePipe = new FormTitlePipe()

        // Act
        const editing: string = pipe.transform( 'groups.form.title', { id: '1' } )
        const creating: string = pipe.transform( 'groups.form.title', undefined )

        // Assert
        expect( editing ).toBe( 'groups.form.title.edit' )
        expect( creating ).toBe( 'groups.form.title.create' )
    } )
} )

describe( 'ProjectOptionIconPipe', () => {
    it.each( [
        [ ProjectOptionEnum.VEHICLE, 'pi pi-car' ],
        [ ProjectOptionEnum.ACTIVITY, 'pi pi-hammer' ],
        [ ProjectOptionEnum.COMMUNICATION, 'pi pi-comment' ],
        [ ProjectOptionEnum.ALERT, 'pi pi-exclamation-triangle' ],
    ] )( 'gives the %s option its icon', (option: ProjectOptionEnum, icon: string) => {
        // Arrange
        const pipe: ProjectOptionIconPipe = new ProjectOptionIconPipe()

        // Act
        const result: string = pipe.transform( option )

        // Assert
        expect( result ).toBe( icon )
    } )

    it( 'gives an unknown option no icon', () => {
        // Arrange
        const pipe: ProjectOptionIconPipe = new ProjectOptionIconPipe()

        // Act
        const result: string = pipe.transform( 'UNKNOWN' as ProjectOptionEnum )

        // Assert
        expect( result ).toBe( '' )
    } )
} )

describe( 'TruncatePipe', () => {
    it( 'cuts long text with a trail and keeps short text', () => {
        // Arrange
        const pipe: TruncatePipe = new TruncatePipe()

        // Act
        const cut: string = pipe.transform( 'a very long sentence indeed', 6 )
        const kept: string = pipe.transform( 'short', 6 )

        // Assert
        expect( cut ).toBe( 'a very…' )
        expect( kept ).toBe( 'short' )
    } )

    it( 'uses twenty characters and an ellipsis by default', () => {
        // Arrange
        const pipe: TruncatePipe = new TruncatePipe()
        const text: string = 'x'.repeat( 30 )

        // Act
        const result: string = pipe.transform( text )

        // Assert
        expect( result ).toBe( 'x'.repeat( 20 ) + '…' )
    } )
} )

describe( 'VisibilityNamePipe', () => {
    it( 'names the visible state with an optional prefix', () => {
        // Arrange
        const pipe: VisibilityNamePipe<GenericModel> = new VisibilityNamePipe<GenericModel>()

        // Act
        const visible: string = pipe.transform( { visible: true } as GenericModel, 'groups' )
        const hidden: string = pipe.transform( { visible: false } as GenericModel, undefined )
        const missing: string = pipe.transform( undefined, 'groups' )

        // Assert
        expect( visible ).toBe( 'groups.visible.true' )
        expect( hidden ).toBe( 'visible.false' )
        expect( missing ).toBe( 'groups.visible.false' )
    } )
} )
