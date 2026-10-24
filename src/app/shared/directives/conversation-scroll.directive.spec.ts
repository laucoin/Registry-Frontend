import { Component, signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConversationScrollDirective } from '@shared/directives/conversation-scroll.directive'
import { CommunicationModel } from '@shared/models/model/communication.model'

@Component({
    imports: [ConversationScrollDirective],
    template: `
        <div [appConversationScroll]="items()" (loadOlder)="older = older + 1">
            @for (item of items(); track item.id) {
                <p class="message" [attr.data-id]="item.id">{{ item.id }}</p>
            }
        </div>
    `,
})
class HostComponent {
    public readonly items: WritableSignal<CommunicationModel[]> = signal([])
    public older: number = 0
}

const message = (id: string): CommunicationModel => ({ id }) as CommunicationModel

describe('ConversationScrollDirective', () => {
    let fixture: ComponentFixture<HostComponent>
    let callback: IntersectionObserverCallback
    let observe: ReturnType<typeof vi.fn>
    let disconnect: ReturnType<typeof vi.fn>
    let scrolled: string[]

    const intersect = (isIntersecting: boolean): void => callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver)
    const settle = async (): Promise<void> => {
        fixture.detectChanges()
        await vi.advanceTimersByTimeAsync(0)
    }

    beforeEach(() => {
        vi.useFakeTimers()
        scrolled = []
        observe = vi.fn()
        disconnect = vi.fn()
        vi.stubGlobal('IntersectionObserver', class {
            public constructor(cb: IntersectionObserverCallback) {
                callback = cb
            }
            public observe: ReturnType<typeof vi.fn> = observe
            public unobserve: ReturnType<typeof vi.fn> = vi.fn()
            public disconnect: ReturnType<typeof vi.fn> = disconnect
        })
        Element.prototype.scrollIntoView = function (this: Element, options?: boolean | ScrollIntoViewOptions): void {
            scrolled.push(`${this.getAttribute('data-id')}:${(options as ScrollIntoViewOptions).block}`)
        }
        TestBed.configureTestingModule({ imports: [HostComponent] })
        fixture = TestBed.createComponent(HostComponent)
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
    })

    it('should scroll to the latest message when the conversation gets a new one', async () => {
        // Arrange
        fixture.componentInstance.items.set([message('a'), message('b')])

        // Act
        await settle()

        // Assert
        expect(scrolled).toEqual(['b:end'])
    })

    it('should ask for older messages when the top is reached once the conversation is shown', async () => {
        // Arrange
        fixture.componentInstance.items.set([message('a'), message('b')])
        await settle()

        // Act
        intersect(true)

        // Assert
        expect(fixture.componentInstance.older).toBe(1)
    })

    it('should not ask for older messages before any message is shown or when the top is not reached', async () => {
        // Arrange
        intersect(true)
        fixture.componentInstance.items.set([message('a')])
        await settle()

        // Act
        intersect(false)

        // Assert
        expect(fixture.componentInstance.older).toBe(0)
    })

    it('should keep the reader on the same message once older ones are added above', async () => {
        // Arrange
        fixture.componentInstance.items.set([message('b'), message('c')])
        await settle()
        intersect(true)
        scrolled = []

        // Act
        fixture.componentInstance.items.set([message('a'), message('b'), message('c')])
        await settle()

        // Assert
        expect(scrolled).toEqual(['b:start'])
    })

    it('should stop observing the top when the host is destroyed', () => {
        // Arrange
        fixture.detectChanges()

        // Act
        fixture.destroy()

        // Assert
        expect(disconnect).toHaveBeenCalled()
    })

    it('should still scroll to the latest message without IntersectionObserver', async () => {
        // Arrange
        vi.unstubAllGlobals()
        vi.stubGlobal('IntersectionObserver', undefined)
        fixture = TestBed.createComponent(HostComponent)
        fixture.componentInstance.items.set([message('a')])

        // Act
        await settle()

        // Assert
        expect(scrolled).toEqual(['a:end'])
    })
})
