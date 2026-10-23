import { NgTemplateOutlet } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Pipe, PipeTransform, signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoTestingModule } from '@jsverse/transloco'
import { beforeEach, describe, expect, it } from 'vitest'
import { RegistryConfig } from '@core/config/registry.config'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { ActivityActions } from '@pages/projects/[projectId]/configuration/activities/activity-row/activity-actions.service'
import { ActivityRowComponent } from '@pages/projects/[projectId]/configuration/activities/activity-row/activity-row.component'
import { ActivityModel } from '@shared/models/model/activity.model'
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'

@Pipe({ name: 'customDateFormat' })
class FakeCustomDateFormatPipe implements PipeTransform {
    public transform(): string {
        return 'date'
    }
}

@Component({
    imports: [ActivityRowComponent, NgTemplateOutlet],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    template: `
        <app-activity-row #row/>
        <ng-container [ngTemplateOutlet]="row.template()" [ngTemplateOutletContext]="{ $implicit: element() }"/>
    `,
})
class HostComponent {
    public readonly element: WritableSignal<ActivityModel> = signal(ELEMENT)
}

const ELEMENT: ActivityModel = { id: 'a1', name: 'Grand jeu', visible: true, status: { value: AvailabilityStatusEnum.AVAILABLE, label: 'Available' }, duration: { value: 'PT2H', label: '2 h' }, allowedParticipants: { lower: 5, upper: 20 } } as unknown as ActivityModel

describe('ActivityRowComponent', () => {
    let fixture: ComponentFixture<HostComponent>

    const text = (selector: string): string | undefined => fixture.nativeElement.querySelector(selector)?.textContent?.trim()
    const tags = (): string[] => Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('sgdf-tag')).map((tag: HTMLElement): string => tag.textContent!.trim())

    async function render(element: ActivityModel): Promise<void> {
        fixture.componentInstance.element.set(element)
        await fixture.whenStable()
    }

    beforeEach(async () => {
        RegistryConfig.config = { enabledActions: [] } as never
        TestBed.configureTestingModule({
            imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
        })
        TestBed.overrideComponent(ActivityRowComponent, {
            remove: { imports: [CustomDateFormatPipe] },
            add: { imports: [FakeCustomDateFormatPipe], providers: [{ provide: ActivityActions, useFactory: (): object => ({ actionsFor: (): never[] => [], menuFor: (): never[] => [], primaryFor: (): undefined => undefined }) }] },
        })
        fixture = TestBed.createComponent(HostComponent)
        await fixture.whenStable()
    })

    it('should title the row with the name, the duration and the allowed participants', async () => {
        // Arrange
        await render(ELEMENT)

        // Act
        const title: string | undefined = text('sgdf-list-item > span.block')
        const description: string | undefined = text('[slot="description"]')

        // Assert
        expect(title).toBe('Grand jeu')
        expect(description).toContain('2 h')
        expect(description).toContain('5-20')
    })

    it('should leave out the duration, the allowed participants and the status an activity does not have', async () => {
        // Arrange
        await render({ ...ELEMENT, duration: undefined, allowedParticipants: undefined, status: undefined } as unknown as ActivityModel)

        // Act
        const description: string | undefined = text('[slot="description"]')

        // Assert
        expect(description).toBe('')
        expect(tags()).toEqual([])
    })

    it('should flag a hidden activity', async () => {
        // Arrange
        await render({ ...ELEMENT, visible: false } as unknown as ActivityModel)

        // Act
        const shown: string[] = tags()

        // Assert
        expect(shown).toContain('fr.activities.visible.false')
    })

    it('should show the availability dates of the activity', async () => {
        // Arrange
        const date: object = { date: '2026-09-18', time: '08:00:00' }
        await render({ ...ELEMENT, startAvailability: date, endAvailability: date } as unknown as ActivityModel)

        // Act
        const icons: number = fixture.nativeElement.querySelectorAll('[slot="description"] sgdf-icon').length

        // Assert
        expect(icons).toBeGreaterThanOrEqual(2)
    })

    it.each([
        [AvailabilityStatusEnum.AVAILABLE, 'success'],
        [AvailabilityStatusEnum.UNAVAILABLE, 'info'],
    ])('should show the %s status in the %s tag variant', async (status: AvailabilityStatusEnum, variant: string) => {
        // Arrange
        await render({ ...ELEMENT, status: { value: status, label: 'S' } } as unknown as ActivityModel)

        // Act
        const statusTag: Element = Array.from(fixture.nativeElement.querySelectorAll('sgdf-tag')).pop() as Element

        // Assert
        expect(statusTag.getAttribute('variant')).toBe(variant)
    })
})
