import { NgTemplateOutlet } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Pipe, PipeTransform, signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoTestingModule } from '@jsverse/transloco'
import { beforeEach, describe, expect, it } from 'vitest'
import { RegistryConfig } from '@core/config/registry.config'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { VehicleActions } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-row/vehicle-actions.service'
import { VehicleRowComponent } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-row/vehicle-row.component'
import { VehicleModel } from '@shared/models/model/vehicle.model'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'

@Pipe({ name: 'customDateFormat' })
class FakeCustomDateFormatPipe implements PipeTransform {
    public transform(): string {
        return 'date'
    }
}

@Component({
    imports: [VehicleRowComponent, NgTemplateOutlet],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    template: `
        <app-vehicle-row #row/>
        <ng-container [ngTemplateOutlet]="row.template()" [ngTemplateOutletContext]="{ $implicit: element() }"/>
    `,
})
class HostComponent {
    public readonly element: WritableSignal<VehicleModel> = signal(ELEMENT)
}

const ELEMENT: VehicleModel = { id: 'v1', licensePlate: 'AB-123-CD', brand: 'Renault', model: 'Trafic', visible: true, status: { value: PresenceStatusEnum.IN, label: 'In' } } as unknown as VehicleModel

describe('VehicleRowComponent', () => {
    let fixture: ComponentFixture<HostComponent>

    const text = (selector: string): string | undefined => fixture.nativeElement.querySelector(selector)?.textContent?.trim()
    const tags = (): string[] => Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('sgdf-tag')).map((tag: HTMLElement): string => tag.textContent!.trim())

    async function render(element: VehicleModel): Promise<void> {
        fixture.componentInstance.element.set(element)
        await fixture.whenStable()
    }

    beforeEach(async () => {
        RegistryConfig.config = { enabledActions: [] } as never
        TestBed.configureTestingModule({
            imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
        })
        TestBed.overrideComponent(VehicleRowComponent, {
            remove: { imports: [CustomDateFormatPipe] },
            add: { imports: [FakeCustomDateFormatPipe], providers: [{ provide: VehicleActions, useFactory: (): object => ({ actionsFor: (): never[] => [], menuFor: (): never[] => [], primaryFor: (): undefined => undefined }) }] },
        })
        fixture = TestBed.createComponent(HostComponent)
        await fixture.whenStable()
    })

    it('should title the row with the license plate and describe the vehicle', async () => {
        // Arrange
        await render(ELEMENT)

        // Act
        const title: string | undefined = text('sgdf-list-item > span.block')
        const description: string | undefined = text('[slot="description"]')

        // Assert
        expect(title).toBe('AB-123-CD')
        expect(description).toContain('Renault Trafic')
    })

    it('should flag a hidden vehicle', async () => {
        // Arrange
        await render({ ...ELEMENT, visible: false } as unknown as VehicleModel)

        // Act
        const shown: string[] = tags()

        // Assert
        expect(shown).toContain('fr.vehicles.visible.false')
    })

    it('should show the availability dates of the vehicle', async () => {
        // Arrange
        const date: object = { date: '2026-09-18', time: '08:00:00' }
        await render({ ...ELEMENT, startAvailability: date, endAvailability: date } as unknown as VehicleModel)

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
        await render({ ...ELEMENT, status: { value: status, label: 'S' } } as unknown as VehicleModel)

        // Act
        const statusTag: Element = Array.from(fixture.nativeElement.querySelectorAll('sgdf-tag')).pop() as Element

        // Assert
        expect(statusTag.getAttribute('variant')).toBe(variant)
    })
})
