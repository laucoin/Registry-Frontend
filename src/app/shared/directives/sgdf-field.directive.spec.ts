import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FieldTree, form, FormField } from '@angular/forms/signals'
import { describe, expect, it, vi } from 'vitest'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { useTimeZone } from '@shared/helpers/testing/time-zone'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/input'
import '@sgdf/ui/option'
import '@sgdf/ui/select'
import '@sgdf/ui/switch'

interface HostModel {
    text: string
    on: boolean
    when: Date | null
    choice: string
    custom: CustomDatetimeModel | null
}

@Component({
    imports: [FormField, SgdfFieldDirective],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    template: `
        <sgdf-input appSgdfField [formField]="tree.text"></sgdf-input>
        <sgdf-switch appSgdfField [formField]="tree.on"></sgdf-switch>
        <sgdf-date-time-picker appSgdfField with-time [formField]="tree.when"></sgdf-date-time-picker>
        <sgdf-date-time-picker id="custom" appSgdfField with-time value-format="separate" [formField]="tree.custom"></sgdf-date-time-picker>
        <sgdf-select appSgdfField [formField]="tree.choice">
            <sgdf-option value="a">A</sgdf-option>
            <sgdf-option value="b">B</sgdf-option>
        </sgdf-select>
    `,
})
class HostComponent {
    public readonly model: WritableSignal<HostModel> = signal({ text: '', on: false, when: null, choice: '', custom: null })
    public readonly tree: FieldTree<HostModel> = form(this.model)
}

type FieldElement = HTMLElement & { value: string, checked: boolean }

describe('SgdfFieldDirective', () => {
    function create(): { fixture: ComponentFixture<HostComponent>, element: (tag: string) => FieldElement } {
        const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent)
        fixture.detectChanges()
        return { fixture, element: (tag: string): FieldElement => fixture.nativeElement.querySelector(tag === 'sgdf-date-time-picker' ? 'sgdf-date-time-picker:not(#custom)' : tag) }
    }

    it('writes the model values to the elements', async () => {
        // Arrange
        const { fixture, element }: ReturnType<typeof create> = create()

        // Act
        fixture.componentInstance.model.set({ text: 'camp', on: true, when: new Date(2026, 9, 3, 14, 5), choice: 'b', custom: null })
        fixture.detectChanges()
        await fixture.whenStable()

        // Assert
        await vi.waitFor((): void => {
            fixture.detectChanges()
            expect(element('sgdf-input').value).toBe('camp')
            expect(element('sgdf-switch').checked).toBe(true)
            expect(element('sgdf-date-time-picker').value).toBe('2026-10-03T14:05')
            expect(element('sgdf-select').value).toBe('b')
        }, { timeout: 3000 })
    })

    it('reads the element values back into the model', async () => {
        // Arrange
        const { fixture, element }: ReturnType<typeof create> = create()
        Object.assign(element('sgdf-input'), { value: 'typed' })
        Object.assign(element('sgdf-switch'), { checked: true })
        Object.assign(element('sgdf-date-time-picker'), { value: '2026-10-03T14:05' })

        // Act
        ;['sgdf-input', 'sgdf-switch', 'sgdf-date-time-picker'].forEach((tag: string): boolean => element(tag).dispatchEvent(new Event('change')))
        await fixture.whenStable()

        // Assert
        expect(fixture.componentInstance.model().text).toBe('typed')
        expect(fixture.componentInstance.model().on).toBe(true)
        expect(fixture.componentInstance.model().when).toEqual(new Date(2026, 9, 3, 14, 5))
    })

    it('reads a date without time as local midnight and an empty picker as null', async () => {
        // Arrange
        const { fixture, element }: ReturnType<typeof create> = create()
        const picker: FieldElement = element('sgdf-date-time-picker')

        // Act
        Object.assign(picker, { value: '2026-10-03' })
        picker.dispatchEvent(new Event('input'))
        const dateOnly: Date | null = fixture.componentInstance.model().when
        Object.assign(picker, { value: '' })
        picker.dispatchEvent(new Event('input'))
        await fixture.whenStable()

        // Assert
        expect(dateOnly).toEqual(new Date(2026, 9, 3, 0, 0))
        expect(fixture.componentInstance.model().when).toBeNull()
    })

    it('marks the field touched on focus out', async () => {
        // Arrange
        const { fixture, element }: ReturnType<typeof create> = create()

        // Act
        element('sgdf-input').dispatchEvent(new Event('focusout'))
        await fixture.whenStable()

        // Assert
        expect(fixture.componentInstance.tree.text().touched()).toBe(true)
    })

    it('holds a custom date time in the separate value format', async () => {
        // Arrange
        const { fixture }: ReturnType<typeof create> = create()
        const picker: FieldElement = fixture.nativeElement.querySelector('#custom')
        const localNineThirty: Date = new Date(2026, 9, 4, 9, 30)

        // Act
        fixture.componentInstance.model.update((m: HostModel): HostModel => ({ ...m, custom: { date: '2026-10-03', time: undefined } }))
        fixture.detectChanges()
        await fixture.whenStable()
        const written: unknown = picker.value
        Object.assign(picker, { value: { date: '2026-10-04', time: '09:30' } })
        picker.dispatchEvent(new Event('change'))
        const typed: CustomDatetimeModel | null = fixture.componentInstance.model().custom
        Object.assign(picker, { value: { date: '', time: '' } })
        picker.dispatchEvent(new Event('change'))

        // Assert
        expect(written).toEqual({ date: '2026-10-03', time: '' })
        expect(typed).toEqual({ date: '2026-10-04', time: localNineThirty.toISOString().slice(11) })
        expect(fixture.componentInstance.model().custom).toBeNull()
    })

    it('shows in local time the UTC time of a custom date time, as the API sends it', async () => {
        // Arrange
        const { fixture }: ReturnType<typeof create> = create()
        const picker: FieldElement = fixture.nativeElement.querySelector('#custom')
        const utc: Date = new Date()
        utc.setUTCHours(7, 5, 0, 0)
        const expectedLocal: string = `${String(utc.getHours()).padStart(2, '0')}:${String(utc.getMinutes()).padStart(2, '0')}`

        // Act
        fixture.componentInstance.model.update((m: HostModel): HostModel => ({ ...m, custom: { date: '2026-10-03', time: '07:05:00.000Z' } }))
        fixture.detectChanges()
        await fixture.whenStable()

        // Assert
        expect(picker.value).toEqual({ date: '2026-10-03', time: expectedLocal })
    })

    describe.each([
        ['UTC', '09:30:00.000Z'],
        ['Asia/Tokyo', '00:30:00.000Z'],
        ['America/New_York', '14:30:00.000Z'],
    ])('time zone %s of a custom date time', (zone: string, utc: string) => {
        useTimeZone(zone)

        it('sends the local time of a winter date as its UTC time', async () => {
            // Arrange
            const { fixture }: ReturnType<typeof create> = create()
            const picker: FieldElement = fixture.nativeElement.querySelector('#custom')

            // Act
            Object.assign(picker, { value: { date: '2026-01-15', time: '09:30' } })
            picker.dispatchEvent(new Event('change'))

            // Assert
            expect(fixture.componentInstance.model().custom).toEqual({ date: '2026-01-15', time: utc })
        })

        it('shows the UTC time of a winter date in local time', async () => {
            // Arrange
            const { fixture }: ReturnType<typeof create> = create()
            const picker: FieldElement = fixture.nativeElement.querySelector('#custom')

            // Act
            fixture.componentInstance.model.update((m: HostModel): HostModel => ({ ...m, custom: { date: '2026-01-15', time: utc } }))
            fixture.detectChanges()
            await fixture.whenStable()

            // Assert
            expect(picker.value).toEqual({ date: '2026-01-15', time: '09:30' })
        })
    })

    describe('time zone of a custom date time', () => {
        useTimeZone('Europe/Paris')

        it.each([
            ['winter', '2026-01-15', '09:30', '08:30:00.000Z'],
            ['summer', '2026-07-15', '09:30', '07:30:00.000Z'],
        ])('sends the local time of a %s date as the UTC time of that date', async (_season: string, date: string, local: string, utc: string) => {
            // Arrange : le cas vient de la table
            const { fixture }: ReturnType<typeof create> = create()
            const picker: FieldElement = fixture.nativeElement.querySelector('#custom')

            // Act
            Object.assign(picker, { value: { date, time: local } })
            picker.dispatchEvent(new Event('change'))

            // Assert
            expect(fixture.componentInstance.model().custom).toEqual({ date, time: utc })
        })

        it.each([
            ['winter', '2026-01-15', '08:30:00.000Z', '09:30'],
            ['summer', '2026-07-15', '07:30:00.000Z', '09:30'],
        ])('shows in local time the UTC time of a %s date', async (_season: string, date: string, utc: string, local: string) => {
            // Arrange : le cas vient de la table
            const { fixture }: ReturnType<typeof create> = create()
            const picker: FieldElement = fixture.nativeElement.querySelector('#custom')

            // Act
            fixture.componentInstance.model.update((m: HostModel): HostModel => ({ ...m, custom: { date, time: utc } }))
            fixture.detectChanges()
            await fixture.whenStable()

            // Assert
            expect(picker.value).toEqual({ date, time: local })
        })

        it('keeps the date chosen by the user when the local time is just after midnight', async () => {
            // Arrange
            const { fixture }: ReturnType<typeof create> = create()
            const picker: FieldElement = fixture.nativeElement.querySelector('#custom')

            // Act
            Object.assign(picker, { value: { date: '2026-07-15', time: '00:30' } })
            picker.dispatchEvent(new Event('change'))

            // Assert
            expect(fixture.componentInstance.model().custom).toEqual({ date: '2026-07-15', time: '22:30:00.000Z' })
        })

        it('keeps the date without time free of any conversion', async () => {
            // Arrange
            const { fixture }: ReturnType<typeof create> = create()
            const picker: FieldElement = fixture.nativeElement.querySelector('#custom')

            // Act
            Object.assign(picker, { value: { date: '2026-07-15', time: '' } })
            picker.dispatchEvent(new Event('change'))

            // Assert
            expect(fixture.componentInstance.model().custom).toEqual({ date: '2026-07-15', time: undefined })
        })
    })
})
