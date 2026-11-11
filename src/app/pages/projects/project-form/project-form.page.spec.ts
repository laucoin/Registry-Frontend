import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Location } from '@angular/common';
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { BehaviorSubject, NEVER, Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { ConfigModel } from '@core/config/model/config.model';
import { RegistryConfig } from '@core/config/registry.config';
import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade';
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade';
import { ProjectFormPage } from '@pages/projects/project-form/project-form.page';
import { ProjectFormHarness } from '@pages/projects/project-form/testing/project-form.harness';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { PROJECT_DTO, WHEN_ETAG } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { NotificationModel } from '@shared/models/model/notification.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { ProjectOptionModel } from '@shared/models/model/project-option.model';

const OPTIONS: ProjectOptionModel[] = [
	{ value: ProjectOptionEnum.VEHICLE, label: 'Vehicle', ask: 'Vehicles?', preRequired: [] },
	{ value: ProjectOptionEnum.ACTIVITY, label: 'Activity', ask: 'Activities?', preRequired: [] },
	{
		value: ProjectOptionEnum.ALERT,
		label: 'Alert',
		ask: 'Alerts?',
		preRequired: [{ label: 'Activity', value: ProjectOptionEnum.ACTIVITY }],
	},
];

const PROJECT = {
	...PROJECT_DTO,
	options: [{ label: 'Vehicle', value: ProjectOptionEnum.VEHICLE }],
} as unknown as ProjectModel;

describe('ProjectFormPage', () => {
	let project: WritableSignal<ProjectModel | undefined>;
	let project$: BehaviorSubject<ProjectModel | undefined>;
	let projectError: WritableSignal<NotificationModel | undefined>;
	let metadataErrors: WritableSignal<Record<string, NotificationModel | undefined>>;
	let createdProjectId: WritableSignal<string | undefined>;
	let facade: Record<string, unknown>;
	let profileFacade: Record<string, unknown>;
	let back: Mock<() => void>;
	let navigateByUrl: Mock<(url: string) => Promise<boolean>>;
	let fixture: ComponentFixture<ProjectFormPage>;

	const mock = (target: Record<string, unknown>, name: string): Mock => target[name] as Mock;

	function create(id: string | undefined = undefined): Promise<ProjectFormHarness> {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: ProjectFacade, useValue: facade },
				{ provide: ProjectProfileFacade, useValue: profileFacade },
				{ provide: Location, useValue: { back } },
				{ provide: Router, useValue: { navigateByUrl } },
				{ provide: ActivatedRoute, useValue: { snapshot: { params: id ? { projectId: id } : {} } } },
				{
					provide: SessionFacade,
					useValue: { selectedProject: signal(undefined), currentUser: signal(undefined) },
				},
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
				{ provide: CustomDateFormatPipe, useValue: { transform: (): string => '' } },
			],
		});
		fixture = TestBed.createComponent(ProjectFormPage);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, ProjectFormHarness);
	}

	async function toOptions(harness: ProjectFormHarness, name = 'Camp'): Promise<void> {
		await (await harness.information())?.typeName(name);
		await harness.next();
	}

	async function tick(index: number): Promise<void> {
		const option: HTMLElement & { checked: boolean } = fixture.nativeElement.querySelectorAll(
			'[data-test-id="project-options-fields-option-switch"]',
		)[index];
		option.checked = true;
		option.dispatchEvent(new Event('change'));
		await fixture.whenStable();
	}

	async function toInvitation(): Promise<ProjectFormHarness> {
		const harness = await create();
		await toOptions(harness);
		await harness.save();
		return harness;
	}

	beforeEach(() => {
		RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel;
		project = signal<ProjectModel | undefined>(undefined);
		project$ = new BehaviorSubject<ProjectModel | undefined>(undefined);
		projectError = signal<NotificationModel | undefined>(undefined);
		metadataErrors = signal({});
		createdProjectId = signal<string | undefined>('new1');
		back = vi.fn();
		navigateByUrl = vi.fn(() => Promise.resolve(true));
		facade = {
			project,
			project$,
			projectError,
			metadataErrors,
			createdProjectId,
			projectLoading: signal(false),
			projectOptionsMetadata: signal(OPTIONS),
			projectOptionsMetadata$: of(OPTIONS),
			resetProject: vi.fn(),
			fetchProjectOptions: vi.fn(),
			fetchProject: vi.fn(),
			createProject: vi.fn((): Observable<unknown> => of({})),
			updateProject: vi.fn((): Observable<unknown> => of({})),
		};
		profileFacade = {
			projectProfileAssignableRolesMetadata: signal([{ label: 'Chief', value: 'CHIEF' }]),
			projectProfileAssignableRolesLoading: signal(false),
			searchedUsersMetadata: signal([{ label: 'u1@x.test', value: { id: 'u1', email: 'u1@x.test' } }]),
			inviteByEmailEnabled: signal(false),
			selectedProjectId: signal(undefined),
			searchUsers: vi.fn(),
			fetchFeatures: vi.fn(),
			fetchAssignableRoles: vi.fn(),
			createProjectProfiles: vi.fn(() => of({ createdEmails: ['u1@x.test'], notCreatedEmails: [] })),
		};
	});

	describe('loading', () => {
		it('resets the project and fetches the options when creating', async () => {
			// Arrange
			const harness = await create();

			// Act
			const title = await harness.title();

			// Assert
			expect([
				title,
				mock(facade, 'resetProject').mock.calls.length,
				mock(facade, 'fetchProject').mock.calls,
			]).toEqual(['fr.projects.form.title.create', 1, []]);
		});

		it('shows the loading state while the project to edit loads', async () => {
			// Arrange
			(facade['projectLoading'] as WritableSignal<boolean>).set(true);

			// Act
			const harness = await create('p1');

			// Assert
			expect([await harness.loading(), mock(facade, 'fetchProject').mock.calls]).toEqual([true, [['p1']]]);
		});

		it.each([
			{ name: 'the project', set: (): void => projectError.set(PageStateHelper.toNotification(ERROR_500)) },
			{
				name: 'the options',
				set: (): void => metadataErrors.set({ options: PageStateHelper.toNotification(ERROR_500) }),
			},
		])('replaces the form with the failure to load $name and reloads on demand', async ({ set }) => {
			// Arrange
			set();
			const harness = await create('p1');

			// Act
			await (await harness.loadError())?.retry();

			// Assert
			expect([await harness.stepper(), mock(facade, 'fetchProject').mock.calls.length]).toEqual([null, 2]);
		});

		it('fills the form with the loaded project and its options, once', async () => {
			// Arrange
			project.set(PROJECT);
			const harness = await create('p1');
			project$.next(PROJECT);
			await (await harness.information())?.typeName('Typed');

			// Act
			project$.next({ ...PROJECT, name: 'Refreshed' });
			const name = await (await harness.information())?.name();
			await harness.next();
			const options = await (await harness.options())?.options();

			// Assert
			expect([name, options?.map((option) => option.checked)]).toEqual(['Typed', [true, false, false]]);
		});
	});

	describe('steps', () => {
		it('starts on the information step without the invitation step when editing', async () => {
			// Arrange
			const harness = await create('p1');

			// Act
			const stepper = await harness.stepper();

			// Assert
			expect([await stepper?.active(), (await stepper?.steps())?.length]).toEqual(['step-1', 2]);
		});

		it('stays on the information step while the name is missing', async () => {
			// Arrange
			const harness = await create();

			// Act
			await harness.next();

			// Assert
			expect([await (await harness.stepper())?.active(), await harness.options()]).toEqual(['step-1', null]);
		});

		it('goes to the options step once the name is typed, and back', async () => {
			// Arrange
			const harness = await create();
			await toOptions(harness);
			const onOptions = await (await harness.stepper())?.steps();

			// Act
			await harness.previous();

			// Assert
			expect([onOptions?.map((step) => step.completed), await (await harness.information())?.name()]).toEqual([
				[true, false, false],
				'Camp',
			]);
		});

		it('leaves the form on cancel', async () => {
			// Arrange
			const harness = await create();

			// Act
			await harness.cancel();

			// Assert
			expect(back).toHaveBeenCalledTimes(1);
		});
	});

	describe('saving', () => {
		it('does not save while an option lacks its prerequisite', async () => {
			// Arrange
			const harness = await create();
			await toOptions(harness);
			await tick(2);

			// Act
			await harness.save();

			// Assert
			expect([
				(await (await harness.options())?.options())?.[2].error !== null,
				mock(facade, 'createProject').mock.calls,
			]).toEqual([true, []]);
		});

		it('sends the ticked options only', async () => {
			// Arrange
			const harness = await create();
			await toOptions(harness);
			await tick(0);
			await tick(1);

			// Act
			await harness.save();

			// Assert
			expect(mock(facade, 'createProject')).toHaveBeenCalledWith({
				name: 'Camp',
				begin: undefined,
				end: undefined,
				options: ['VEHICLE', 'ACTIVITY'],
			});
		});

		it('ignores a second submit while the project is being saved', async () => {
			// Arrange
			mock(facade, 'createProject').mockReturnValue(NEVER);
			const harness = await create();
			await toOptions(harness);

			// Act
			await harness.save();
			await harness.save();

			// Assert
			expect(mock(facade, 'createProject')).toHaveBeenCalledTimes(1);
		});

		it('creates the project then offers to invite users instead of leaving', async () => {
			// Arrange
			const harness = await toInvitation();

			// Act
			const shown = [
				await harness.title(),
				await harness.createdTitle(),
				await (await harness.stepper())?.active(),
			];

			// Assert
			expect([shown, mock(profileFacade, 'fetchAssignableRoles').mock.calls, back.mock.calls.length]).toEqual([
				['fr.project-profiles.form.title.create', 'fr.projects.form.invitation.created.title', 'step-3'],
				[['new1']],
				0,
			]);
		});

		it('goes back when the created project id is unknown', async () => {
			// Arrange
			createdProjectId.set(undefined);

			// Act
			await toInvitation();

			// Assert
			expect(back).toHaveBeenCalledTimes(1);
		});

		it('updates the loaded project and goes back', async () => {
			// Arrange
			project.set(PROJECT);
			const harness = await create('p1');
			project$.next(PROJECT);
			await toOptions(harness, 'Camp');

			// Act
			await harness.save();

			// Assert
			expect([mock(facade, 'updateProject').mock.calls[0], back.mock.calls.length]).toEqual([
				['p1', expect.objectContaining({ name: 'Camp', options: ['VEHICLE'] }), WHEN_ETAG],
				1,
			]);
		});
	});

	describe('invitation step', () => {
		async function chooseInvitation(harness: ProjectFormHarness): Promise<void> {
			await harness.chooseRole('CHIEF');
			const users = await harness.users();
			await users.search('u1@x.test');
			await users.choose('u1');
		}

		it('opens the created project when the step is skipped', async () => {
			// Arrange
			const harness = await toInvitation();

			// Act
			await harness.skip();

			// Assert
			expect([navigateByUrl.mock.calls, mock(profileFacade, 'createProjectProfiles').mock.calls]).toEqual([
				[['projects/new1']],
				[],
			]);
		});

		it('does not invite without role nor user', async () => {
			// Arrange
			const harness = await toInvitation();

			// Act
			await harness.invite();

			// Assert
			expect([mock(profileFacade, 'createProjectProfiles').mock.calls, navigateByUrl.mock.calls]).toEqual([
				[],
				[],
			]);
		});

		it('invites the chosen users into the created project then opens it', async () => {
			// Arrange
			const harness = await toInvitation();
			await chooseInvitation(harness);

			// Act
			await harness.invite();

			// Assert
			expect([mock(profileFacade, 'createProjectProfiles').mock.calls, navigateByUrl.mock.calls]).toEqual([
				[[{ emails: ['u1@x.test'], role: 'CHIEF', startAccess: undefined, endAccess: undefined }, 'new1']],
				[['projects/new1']],
			]);
		});

		it('ignores a second invitation while the first one is being sent', async () => {
			// Arrange
			mock(profileFacade, 'createProjectProfiles').mockReturnValue(NEVER);
			const harness = await toInvitation();
			await chooseInvitation(harness);

			// Act
			await harness.invite();
			await harness.invite();

			// Assert
			expect(mock(profileFacade, 'createProjectProfiles')).toHaveBeenCalledTimes(1);
		});

		it('stays on the step when the invitation fails', async () => {
			// Arrange
			mock(profileFacade, 'createProjectProfiles').mockReturnValue(throwError(() => ERROR_500));
			const harness = await toInvitation();
			await chooseInvitation(harness);

			// Act
			await harness.invite();

			// Assert
			expect([navigateByUrl.mock.calls, await (await harness.stepper())?.active()]).toEqual([[], 'step-3']);
		});
	});
});
