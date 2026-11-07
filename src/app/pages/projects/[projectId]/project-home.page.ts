import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { EventHelper } from '@shared/helpers/event.helper';
import { RouteHelper } from '@shared/helpers/route.helper';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { ProjectRoleEnum } from '@shared/models/enumeration/project-role.enum';
import { FavoriteToggleComponent } from '@shared/ui/common/favorite-toggle/favorite-toggle.component';
import { CommunicationFormComponent } from '@shared/ui/domain/communication-form/communication-form.component';
import { ProjectActiveAlertComponent } from '@shared/ui/domain/project-active-alert/project-active-alert.component';
import { ProjectBirthdayComponent } from '@shared/ui/domain/project-birthday/project-birthday.component';
import { ProjectOperationalMonitoringComponent } from '@shared/ui/domain/project-operational-monitoring/project-operational-monitoring.component';
import { ProjectParticipantOverviewComponent } from '@shared/ui/domain/project-participant-overview/project-participant-overview.component';
import { ProjectParticipantRegularizationComponent } from '@shared/ui/domain/project-participant-regularization/project-participant-regularization.component';
import { ProjectUpcomingArrivalComponent } from '@shared/ui/domain/project-upcoming-arrival/project-upcoming-arrival.component';
import { ProjectUpcomingDepartureComponent } from '@shared/ui/domain/project-upcoming-departure/project-upcoming-departure.component';
import { ProjectVehicleOverviewComponent } from '@shared/ui/domain/project-vehicle-overview/project-vehicle-overview.component';

import '@sgdf/ui/button';
import '@sgdf/ui/drawer';
import '@sgdf/ui/icon';
import '@sgdf/ui/page-title';

/**
 * Purpose: Page d'accueil du projet sélectionné.
 * Scope: Charge les informations d'accueil du projet, affiche le tableau de bord et propose les raccourcis de création d'un mouvement ou d'une alerte.
 * Limits: Lit uniquement via la facade du projet sélectionné.
 */
@Component({
	selector: 'app-project-home',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	imports: [
		TranslocoPipe,
		RouterLink,
		FavoriteToggleComponent,
		CommunicationFormComponent,
		ProjectParticipantOverviewComponent,
		ProjectParticipantRegularizationComponent,
		ProjectActiveAlertComponent,
		ProjectUpcomingArrivalComponent,
		ProjectUpcomingDepartureComponent,
		ProjectBirthdayComponent,
		ProjectOperationalMonitoringComponent,
		ProjectVehicleOverviewComponent,
	],
	templateUrl: './project-home.page.html',
})
export class ProjectHomePage {
	private readonly sessionFacade = inject(SessionFacade);

	protected readonly uiFacade = inject(UiFacade);

	protected readonly project = this.sessionFacade.selectedProject;
	protected readonly hasVehicleOption = this.sessionFacade.selectedProjectHasOption(ProjectOptionEnum.VEHICLE);
	protected readonly canSeePlannedMovements = computed(() =>
		CurrentUserHelper.hasProjectAuthority(
			this.sessionFacade.currentUser(),
			this.sessionFacade.currentProjectId(),
			ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_C,
		),
	);
	protected readonly hasAlertOption = this.sessionFacade.selectedProjectHasOption(ProjectOptionEnum.ALERT);
	protected readonly canCreateMovement = this.canSeePlannedMovements;
	protected readonly canCreateAlert = computed(
		() =>
			this.hasAlertOption() &&
			CurrentUserHelper.hasProjectAuthority(
				this.sessionFacade.currentUser(),
				this.sessionFacade.currentProjectId(),
				ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_C,
			),
	);
	protected readonly canSeeProfileWidgets = computed(() => this.buildCanSeeProfileWidgets());
	protected readonly creatingAlert = signal(false);

	protected readonly registeredMovementRoute = computed(() =>
		this.projectRoute(RegistryRouteEnum.PROJECTS_MOVEMENTS_REGISTERED_CREATION),
	);
	protected readonly guestMovementRoute = computed(() =>
		this.projectRoute(RegistryRouteEnum.PROJECTS_MOVEMENTS_GUEST_CREATION),
	);

	protected toggleFavorite(): void {
		this.sessionFacade.toggleSelectedProjectFavorite();
	}

	protected closeAlertDrawer(event: Event): void {
		if (EventHelper.isFromHost(event)) {
			this.creatingAlert.set(false);
		}
	}

	private projectRoute(route: RegistryRouteEnum): string {
		return RouteHelper.absolute(route).replace(':projectId', this.sessionFacade.currentProjectId() ?? '');
	}

	private buildCanSeeProfileWidgets(): boolean {
		const role = this.project()?.profile?.role.value;
		return role === ProjectRoleEnum.PROJECT_ADMINISTRATOR || role === ProjectRoleEnum.PROJECT_COORDINATOR;
	}
}
