import { NgTemplateOutlet } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Pipe, PipeTransform, signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { TranslocoTestingModule } from '@jsverse/transloco'
import { beforeEach, describe, expect, it } from 'vitest'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { ParticipantActions } from '@pages/projects/[projectId]/configuration/participants/participant-row/participant-actions.service'
import { ParticipantRowComponent } from '@pages/projects/[projectId]/configuration/participants/participant-row/participant-row.component'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'

@Pipe({ name: 'customDateFormat' })
class FakeCustomDateFormatPipe implements PipeTransform {
    public transform(): string {
        return 'date'
    }
}

@Component({
    imports: [ParticipantRowComponent, NgTemplateOutlet],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    template: `
        <app-participant-row #row [groupId]="'g1'"/>
        <ng-container [ngTemplateOutlet]="row.template()" [ngTemplateOutletContext]="{ $implicit: element() }"/>
    `,
})
class HostComponent {
    public readonly element: WritableSignal<ParticipantModel> = signal(ELEMENT)
}

const ELEMENT: ParticipantModel = {
    id: 'p1',
    firstName: 'ada',
    lastName: 'Lovelace',
    visible: true,
    status: { value: PresenceStatusEnum.IN, label: 'In' },
    groups: [{ id: 'g1', name: 'Unité' }],
} as unknown as ParticipantModel

describe('ParticipantRowComponent', () => {
    let fixture: ComponentFixture<HostComponent>

    const text = (selector: string): string | undefined => fixture.nativeElement.querySelector(selector)?.textContent?.trim()
    const tags = (): string[] => Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('sgdf-tag')).map((tag: HTMLElement): string => tag.textContent!.trim())

    async function render(element: ParticipantModel): Promise<void> {
        fixture.componentInstance.element.set(element)
        await fixture.whenStable()
    }

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
        })
        TestBed.overrideComponent(ParticipantRowComponent, {
            remove: { imports: [CustomDateFormatPipe] },
            add: { imports: [FakeCustomDateFormatPipe], providers: [{ provide: ParticipantActions, useFactory: (): object => ({ actionsFor: (): never[] => [], menuFor: (): never[] => [], primaryFor: (): undefined => undefined }) }] },
        })
        fixture = TestBed.createComponent(HostComponent)
        await fixture.whenStable()
    })

    it('should title the row with the full name and show the single group and the presence', async () => {
        // Arrange
        await render(ELEMENT)

        // Act
        const title: string | undefined = text('sgdf-list-item > span.block')
        const description: string | undefined = text('[slot="description"]')

        // Assert
        expect(title).toBe('ada LOVELACE')
        expect(description).toContain('Unité')
        expect(tags()).toEqual(['In'])
    })

    it('should grey out a hidden participant and label it with a visible tag', async () => {
        // Arrange
        await render({ ...ELEMENT, visible: false } as unknown as ParticipantModel)

        // Act
        const row: HTMLElement & { disabled: boolean } = fixture.nativeElement.querySelector('sgdf-list-item')
        const notice: string | undefined = text('sgdf-list-item > [slot="end"] > sgdf-tag:first-child')

        // Assert
        expect(row.disabled).toBe(true)
        expect(notice).toBe('fr.participants.visible.false')
    })

    it('should keep a visible participant enabled', async () => {
        // Arrange
        await render(ELEMENT)

        // Act
        const row: HTMLElement & { disabled: boolean } = fixture.nativeElement.querySelector('sgdf-list-item')

        // Assert
        expect(row.disabled).toBe(false)
    })

    it('should list the other groups of a participant in a dialog', async () => {
        // Arrange
        await render({ ...ELEMENT, groups: [{ id: 'g1', name: 'Unité' }, { id: 'g2', name: 'Équipe' }] } as unknown as ParticipantModel)
        const opener: HTMLElement = fixture.nativeElement.querySelector('[slot="description"] sgdf-button')

        // Act
        opener.click()
        await fixture.whenStable()

        // Assert
        const dialog: HTMLElement & { open: boolean } = fixture.nativeElement.querySelector('sgdf-dialog')
        expect(dialog.open).toBe(true)
        expect(Array.from(dialog.querySelectorAll('sgdf-list-item')).map((item: Element): string | undefined => item.textContent?.trim())).toEqual(['Unité', 'Équipe'])
    })

    it('should close the groups dialog only when the dialog itself is hidden', async () => {
        // Arrange
        await render({ ...ELEMENT, groups: [{ id: 'g1', name: 'Unité' }, { id: 'g2', name: 'Équipe' }] } as unknown as ParticipantModel)
        fixture.nativeElement.querySelector('[slot="description"] sgdf-button').click()
        const row: { closeDialog: (event: Event) => void, groupsOf: () => unknown } = fixture.debugElement.query(By.directive(ParticipantRowComponent)).componentInstance
        const dialog: EventTarget = new EventTarget()

        // Act
        row.closeDialog({ target: new EventTarget(), currentTarget: dialog } as unknown as Event)
        const afterNested: unknown = row.groupsOf()
        row.closeDialog({ target: dialog, currentTarget: dialog } as unknown as Event)

        // Assert
        expect(afterNested).toBeDefined()
        expect(row.groupsOf()).toBeUndefined()
    })

    it('should show the availability dates of the participant', async () => {
        // Arrange
        const date: object = { date: '2026-09-18', time: '08:00:00' }
        await render({ ...ELEMENT, startAvailability: date, endAvailability: date } as unknown as ParticipantModel)

        // Act
        const icons: number = fixture.nativeElement.querySelectorAll('[slot="description"] sgdf-icon').length

        // Assert
        expect(icons).toBe(1)
    })

    it.each([
        [PresenceStatusEnum.IN, 'success'],
        [PresenceStatusEnum.OUT, 'warning'],
        ['OTHER', 'neutral'],
    ])('should show the %s presence in the %s tag variant', async (status: string, variant: string) => {
        // Arrange
        await render({ ...ELEMENT, status: { value: status, label: 'S' } } as unknown as ParticipantModel)

        // Act
        const statusTag: Element = Array.from(fixture.nativeElement.querySelectorAll('sgdf-tag')).pop() as Element

        // Assert
        expect(statusTag.getAttribute('variant')).toBe(variant)
    })
})
