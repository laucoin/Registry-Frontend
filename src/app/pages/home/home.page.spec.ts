import { signal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoPipe } from '@jsverse/transloco'
import { MockBuilder } from 'ng-mocks'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { SessionFacade } from '@core/registry/state/session.facade'
import { HomePage } from './home.page'

describe('HomePage', () => {
	let fixture: ComponentFixture<HomePage>

	async function render(canCreate: boolean): Promise<void> {
		vi.spyOn(CurrentUserHelper, 'hasUserAuthority').mockReturnValue(canCreate)
		fixture = TestBed.createComponent(HomePage)
		await fixture.whenStable()
	}

	beforeEach(async () => {
		await MockBuilder(HomePage)
			.mock(TranslocoPipe, (key: string): string => key)
			.provide({ provide: SessionFacade, useValue: { currentUser: signal({ firstName: 'Luc' }) } })
	})

	it('should show the four home widgets', async () => {
		await render(true)
		const element: HTMLElement = fixture.nativeElement

		expect(element.querySelector('app-home-favorite-projects')).not.toBeNull()
		expect(element.querySelector('app-home-invitations')).not.toBeNull()
		expect(element.querySelector('app-home-attention-projects')).not.toBeNull()
		expect(element.querySelector('app-home-quick-access')).not.toBeNull()
	})

	it('should offer to create a project only to a user allowed to', async () => {
		await render(false)

		expect(fixture.nativeElement.querySelector('sgdf-button')).toBeNull()
	})
})
