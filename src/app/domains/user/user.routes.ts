import { importProvidersFrom } from '@angular/core'
import { Routes } from '@angular/router'
import { NgxsModule } from '@ngxs/store'
import { ProjectProfileFacade } from '../project/configuration/project-profile/data/state/project-profile.facade'
import { ProjectProfileState } from '../project/configuration/project-profile/data/state/project-profile.state'
import { InvitationsListComponent } from './invitations-list/invitations-list.component'
import { ProfilesListComponent } from './profiles-list/profiles-list.component'
import { SettingComponent } from './setting/setting.component'
import { UserFormComponent } from './user-form/user-form.component'
import { UserRoutesEnum } from './user-routes.enum'
import { UserComponent } from './user.component'
import { UsersListComponent } from './users-list/users-list.component'

export const userRoutes: Routes = [
	{
		path: '',
		component: UserComponent,
		children: [
			{
				path: '', component: UsersListComponent,
			},
			{
				path: UserRoutesEnum.EDIT, component: UserFormComponent,
			},
			{
				path: UserRoutesEnum.PROFILES,
				component: ProfilesListComponent,
				providers: [ProjectProfileFacade, importProvidersFrom(NgxsModule.forFeature([ProjectProfileState]))],
			},
			{
				path: UserRoutesEnum.INVITATIONS,
				component: InvitationsListComponent,
				providers: [ProjectProfileFacade, importProvidersFrom(NgxsModule.forFeature([ProjectProfileState]))],
			},
			{
				path: UserRoutesEnum.SETTINGS, component: SettingComponent,
			},
		],
	},
]
