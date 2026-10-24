import { Component, signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoPipe } from '@jsverse/transloco'
import { MockBuilder } from 'ng-mocks'
import { beforeEach, describe, expect, it } from 'vitest'
import { SkeletonListComponent } from '@shared/ui/common/skeleton-list/skeleton-list.component'

@Component({
    imports: [SkeletonListComponent],
    template: `<app-skeleton-list [rows]="rows()" [appearance]="appearance()" [withDescription]="withDescription()"/>`,
})
class HostComponent {
    public readonly rows: WritableSignal<number> = signal(3)
    public readonly appearance: WritableSignal<'text' | 'soft'> = signal('text')
    public readonly withDescription: WritableSignal<boolean> = signal(false)
}

describe('SkeletonListComponent', () => {
    let fixture: ComponentFixture<HostComponent>
    let host: HostComponent

    const render = async (): Promise<void> => {
        fixture.detectChanges()
        await fixture.whenStable()
    }
    const count = (selector: string): number => fixture.nativeElement.querySelectorAll(selector).length

    beforeEach(async () => {
        await MockBuilder(HostComponent)
            .keep(SkeletonListComponent)
            .mock(TranslocoPipe, (key: string): string => key)
        fixture = TestBed.createComponent(HostComponent)
        host = fixture.componentInstance
    })

    it('renders one item per requested row', async () => {
        // Arrange
        host.rows.set(5)

        // Act
        await render()

        // Assert
        expect(count('sgdf-list-item')).toBe(5)
    })

    it('announces the list as busy with the loading label', async () => {
        // Arrange
        const expectedLabel: string = 'global.list.loading'

        // Act
        await render()

        // Assert
        const list: HTMLElement = fixture.nativeElement.querySelector('sgdf-list')
        expect(list.getAttribute('aria-busy')).toBe('true')
        expect((list as HTMLElement & { label?: string }).label).toBe(expectedLabel)
    })

    it('adds a description line to every row only when asked', async () => {
        // Arrange
        host.withDescription.set(true)

        // Act
        await render()

        // Assert
        expect(count('sgdf-skeleton[slot="description"]')).toBe(3)
    })

    it('renders no description line by default', async () => {
        // Arrange

        // Act
        await render()

        // Assert
        expect(count('sgdf-skeleton[slot="description"]')).toBe(0)
        expect(count('sgdf-skeleton[slot="start"]')).toBe(3)
    })

    it('forwards the appearance to the list', async () => {
        // Arrange
        host.appearance.set('soft')

        // Act
        await render()

        // Assert
        const list: HTMLElement & { appearance?: string } = fixture.nativeElement.querySelector('sgdf-list')
        expect(list.appearance).toBe('soft')
    })
})
