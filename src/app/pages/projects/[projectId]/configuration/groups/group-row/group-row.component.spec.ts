import { NgTemplateOutlet } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Pipe, PipeTransform, signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoTestingModule } from '@jsverse/transloco'
import { beforeEach, describe, expect, it } from 'vitest'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { GroupActions } from '@pages/projects/[projectId]/configuration/groups/group-row/group-actions.service'
import { GroupRowComponent } from '@pages/projects/[projectId]/configuration/groups/group-row/group-row.component'
import { GroupModel } from '@shared/models/model/group.model'
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'

@Pipe({ name: 'customDateFormat' })
class FakeCustomDateFormatPipe implements PipeTransform {
    public transform(): string {
        return 'date'
    }
}

@Component({
    imports: [GroupRowComponent, NgTemplateOutlet],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    template: `
        <app-group-row #row/>
        <ng-container [ngTemplateOutlet]="row.template()" [ngTemplateOutletContext]="{ $implicit: element() }"/>
    `,
})
class HostComponent {
    public readonly element: WritableSignal<GroupModel> = signal(ELEMENT)
}

const ELEMENT: GroupModel = { id: 'g1', name: 'Unité Caravelle', visible: true, membersCount: 3, insideMembersCount: 2, outsideMembersCount: 1, status: { value: AvailabilityStatusEnum.AVAILABLE, label: 'Available' } } as unknown as GroupModel

describe('GroupRowComponent', () => {
    let fixture: ComponentFixture<HostComponent>

    const text = (selector: string): string | undefined => fixture.nativeElement.querySelector(selector)?.textContent?.trim()
    const tags = (): string[] => Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('sgdf-tag')).map((tag: HTMLElement): string => tag.textContent!.trim())

    async function render(element: GroupModel): Promise<void> {
        fixture.componentInstance.element.set(element)
        await fixture.whenStable()
    }

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
        })
        TestBed.overrideComponent(GroupRowComponent, {
            remove: { imports: [CustomDateFormatPipe] },
            add: { imports: [FakeCustomDateFormatPipe], providers: [{ provide: GroupActions, useFactory: (): object => ({ actionsFor: (): never[] => [], menuFor: (): never[] => [], primaryFor: (): undefined => undefined }) }] },
        })
        fixture = TestBed.createComponent(HostComponent)
        await fixture.whenStable()
    })

    it('should title the row with the name of the group and show its status', async () => {
        // Arrange
        await render(ELEMENT)

        // Act
        const title: string | undefined = text('sgdf-list-item > span.block')

        // Assert
        expect(title).toBe('Unité Caravelle')
        expect(tags()).toEqual(['Available'])
    })

    it('should grey out a hidden group and announce it to assistive technologies', async () => {
        // Arrange
        await render({ ...ELEMENT, visible: false } as unknown as GroupModel)

        // Act
        const row: HTMLElement & { disabled: boolean } = fixture.nativeElement.querySelector('sgdf-list-item')
        const notice: string | undefined = text('sgdf-list-item > .sr-only')

        // Assert
        expect(row.disabled).toBe(true)
        expect(notice).toBe('(fr.groups.visible.false)')
    })

    it('should keep a visible group enabled', async () => {
        // Arrange
        await render(ELEMENT)

        // Act
        const row: HTMLElement & { disabled: boolean } = fixture.nativeElement.querySelector('sgdf-list-item')

        // Assert
        expect(row.disabled).toBe(false)
    })

    it('should show the availability dates of the group', async () => {
        // Arrange
        const start: object = { date: '2026-09-18', time: '08:00:00' }
        await render({ ...ELEMENT, startAvailability: start, endAvailability: start } as unknown as GroupModel)

        // Act
        const icons: number = fixture.nativeElement.querySelectorAll('[slot="description"] sgdf-icon').length

        // Assert
        expect(icons).toBe(1)
    })

    it.each([
        [AvailabilityStatusEnum.AVAILABLE, 'success'],
        [AvailabilityStatusEnum.UNAVAILABLE, 'info'],
    ])('should show the %s status in the %s tag variant', async (status: AvailabilityStatusEnum, variant: string) => {
        // Arrange
        await render({ ...ELEMENT, status: { value: status, label: 'S' } } as unknown as GroupModel)

        // Act
        const statusTag: Element = Array.from(fixture.nativeElement.querySelectorAll('sgdf-tag')).pop() as Element

        // Assert
        expect(statusTag.getAttribute('variant')).toBe(variant)
    })
})
