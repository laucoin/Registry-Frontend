import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { GenericFacade } from './generic.facade'

class TestFacade extends GenericFacade {
    public label (label: string): string {
        return this.translateLabel( label )
    }
}

describe( 'GenericFacade', () => {
    const translate: Mock<(key: string) => string> = vi.fn( (key: string): string => `translated:${key}` )
    let facade: TestFacade

    beforeEach( () => {
        translate.mockClear()
        TestBed.configureTestingModule( { providers: [ { provide: TranslocoService, useValue: { translate } } ] } )
        facade = TestBed.runInInjectionContext( (): TestFacade => new TestFacade() )
    } )

    it( 'translates a label key', () => {
        // Arrange
        const key: string = 'global.menu.projects'

        // Act
        const result: string = facade.label( key )

        // Assert
        expect( result ).toBe( 'translated:global.menu.projects' )
        expect( translate ).toHaveBeenCalledWith( key )
    } )

    it( 'keeps the empty option label untouched', () => {
        // Arrange
        const emptyLabel: string = '-'

        // Act
        const result: string = facade.label( emptyLabel )

        // Assert
        expect( result ).toBe( '-' )
        expect( translate ).not.toHaveBeenCalled()
    } )
} )
