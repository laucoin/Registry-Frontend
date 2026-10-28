import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoPipe } from '@jsverse/transloco'
import { MockBuilder } from 'ng-mocks'
import { beforeEach, describe, expect, it } from 'vitest'
import { UserElementComponent } from '@pages/users/user-element/user-element.component'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { VisibilityNamePipe } from '@shared/helpers/pipe/visibility.pipe'
import { UserModel } from '@shared/models/model/user.model'

const USER: UserModel = {
    id: 'u1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.org',
    role: { label: 'Administrator', value: 'ADMIN' },
    birthday: new Date(1815, 11, 10),
    visible: true,
} as UserModel

describe('UserElementComponent', () => {
    let fixture: ComponentFixture<UserElementComponent>

    const text = (selector: string): string | undefined => fixture.nativeElement.querySelector(selector)?.textContent?.trim()
    const tags = (): string[] => Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('sgdf-tag')).map((tag: HTMLElement): string => tag.textContent!.trim())

    async function render(user: UserModel): Promise<void> {
        fixture.componentRef.setInput('user', user)
        await fixture.whenStable()
    }

    beforeEach(async () => {
        await MockBuilder(UserElementComponent)
            .keep(VisibilityNamePipe)
            .mock(TranslocoPipe, (key: string): string => key)
            .mock(DateFormatPipe, (): string => 'date')
        fixture = TestBed.createComponent(UserElementComponent)
    })

    it('should show the name with the last name in capitals and the initials', async () => {
        // Arrange
        await render(USER)

        // Act
        const name: string | undefined = text('sgdf-list-item > span')
        const initials: string = fixture.nativeElement.querySelector('sgdf-avatar').initials

        // Assert
        expect(name).toBe('Ada LOVELACE')
        expect(initials).toBe('AL')
    })

    it('should fall back on the email when the user has no name', async () => {
        // Arrange
        await render({ ...USER, firstName: undefined, lastName: undefined })

        // Act
        const name: string | undefined = text('sgdf-list-item > span')
        const initials: string = fixture.nativeElement.querySelector('sgdf-avatar').initials

        // Assert
        expect(name).toBe('ada@example.org')
        expect(initials).toBe('A')
    })

    it('should show the email, the birthday, the role and the visibility', async () => {
        // Arrange
        await render(USER)

        // Act
        const description: string | undefined = text('[slot="description"]')

        // Assert
        expect(description).toContain('ada@example.org')
        expect(description).toContain('date')
        expect(tags()).toEqual(['Administrator', 'users.visible.true'])
    })

    it('should leave out the birthday and the role the user does not have and mark a blocked user', async () => {
        // Arrange
        await render({ ...USER, birthday: undefined, role: undefined, visible: false } as unknown as UserModel)

        // Act
        const description: string | undefined = text('[slot="description"]')
        const visibility: { variant: string } = fixture.nativeElement.querySelector('sgdf-tag')

        // Assert
        expect(description).toBe('ada@example.org')
        expect(tags()).toEqual(['users.visible.false'])
        expect(visibility.variant).toBe('warning')
    })
})
