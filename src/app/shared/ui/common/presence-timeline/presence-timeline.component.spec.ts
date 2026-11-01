import { Subject } from 'rxjs'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { MockBuilder, ngMocks } from 'ng-mocks'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component'
import { OutingModel } from '@shared/models/model/outing.model'
import { PresenceTimelineComponent } from './presence-timeline.component'

const OUTING: OutingModel = { start: new Date( 2026, 6, 4, 9, 0 ), end: new Date( 2026, 6, 4, 12, 30 ), ongoing: false }

interface TimelineElement extends HTMLElement {
    start: string
    end: string
    ranges: { variant: string, label?: string }[]
}

describe( 'PresenceTimelineComponent', () => {
    let fixture: ComponentFixture<PresenceTimelineComponent>

    function timeline (testId: string): TimelineElement {
        return fixture.nativeElement.querySelector( `[data-testid="${testId}"]` )
    }

    function create (inputs: Record<string, unknown>): void {
        fixture = TestBed.createComponent( PresenceTimelineComponent )
        Object.entries( inputs ).forEach( ([ name, value ]: [ string, unknown ]): void => fixture.componentRef.setInput( name, value ) )
        fixture.detectChanges()
    }

    beforeEach( async () => {
        await MockBuilder( PresenceTimelineComponent )
            .mock( TranslocoPipe, (key: string): string => key )
            .provide( { provide: TranslocoService, useValue: { translate: (key: string, params?: object): string => `${key}:${JSON.stringify( params )}`, getActiveLang: (): string => 'en', langChanges$: new Subject<string>().asObservable() } } )
            .keep( SectionErrorComponent )
    } )

    it( 'draws the planned and the actual timelines on the axis of the project', () => {
        // Arrange
        const inputs: Record<string, unknown> = {
            projectBegin: { date: '2026-07-01', time: undefined }, projectEnd: { date: '2026-07-10', time: undefined },
            planned: [ { start: { date: '2026-07-03', time: undefined }, end: undefined } ], actual: [ OUTING ],
        }

        // Act
        create( inputs )

        // Assert
        expect( timeline( 'presence-timeline-planned-timeline' ).start ).toBe( '2026-07-01T00:00' )
        expect( timeline( 'presence-timeline-planned-timeline' ).ranges[ 0 ].variant ).toBe( 'info' )
        expect( timeline( 'presence-timeline-actual-timeline' ).end ).toBe( '2026-07-10T23:59' )
        expect( timeline( 'presence-timeline-actual-timeline' ).ranges[ 0 ].variant ).toBe( 'warning' )
    } )

    it( 'says when nothing is planned or when there is no outing', () => {
        // Arrange
        const inputs: Record<string, unknown> = { projectBegin: { date: '2026-07-01', time: undefined }, projectEnd: { date: '2026-07-10', time: undefined } }

        // Act
        create( inputs )

        // Assert
        expect( fixture.nativeElement.querySelector( '[data-testid="presence-timeline-planned-empty"]' ) ).not.toBeNull()
        expect( fixture.nativeElement.querySelector( '[data-testid="presence-timeline-actual-empty"]' ) ).not.toBeNull()
    } )

    it( 'labels an ongoing outing with its start in the active language', () => {
        // Arrange
        const ongoing: OutingModel = { ...OUTING, ongoing: true }

        // Act
        create( { projectBegin: { date: '2026-07-01', time: undefined }, projectEnd: { date: '2026-07-10', time: undefined }, actual: [ ongoing ] } )

        // Assert
        expect( timeline( 'presence-timeline-actual-timeline' ).ranges[ 0 ].label ).toContain( 'timeline.ongoing' )
        expect( timeline( 'presence-timeline-actual-timeline' ).ranges[ 0 ].variant ).toBe( 'danger' )
    } )

    it( 'explains that there is no period when the project has no dates and nothing is known', () => {
        // Arrange

        // Act
        create( {} )

        // Assert
        expect( fixture.nativeElement.querySelector( '[data-testid="presence-timeline-no-period"]' ) ).not.toBeNull()
        expect( fixture.nativeElement.querySelector( '[data-testid="presence-timeline-section"]' ) ).toBeNull()
    } )

    it( 'shows a busy placeholder instead of the timelines while loading', () => {
        // Arrange

        // Act
        create( { loading: true, projectBegin: { date: '2026-07-01', time: undefined }, projectEnd: { date: '2026-07-10', time: undefined } } )

        // Assert
        expect( fixture.nativeElement.querySelector( '[data-testid="presence-timeline-loading"]' )?.getAttribute( 'aria-busy' ) ).toBe( 'true' )
        expect( timeline( 'presence-timeline-planned-timeline' ) ).toBeNull()
    } )

    it( 'shows the failure instead of the timelines and relays the retry', () => {
        // Arrange
        const retried: (value: void) => void = vi.fn()
        create( { error: { summary: 'Unavailable', detail: 'Try later' } } )
        fixture.componentInstance.retry.subscribe( retried )

        // Act
        ngMocks.output( ngMocks.find( SectionErrorComponent ), 'retry' ).emit()

        // Assert
        expect( fixture.nativeElement.querySelector( '[data-testid="presence-timeline-error"]' ) ).not.toBeNull()
        expect( retried ).toHaveBeenCalledTimes( 1 )
    } )
} )
