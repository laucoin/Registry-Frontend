import { HttpStatusCode } from '@angular/common/http';
import { computed, inject, Injectable, Signal } from '@angular/core';
import { Router } from '@angular/router';

import {
	catchError,
	EMPTY,
	filter,
	map,
	mergeMap,
	Observable,
	of,
	ReplaySubject,
	Subscription,
	switchMap,
	tap,
} from 'rxjs';

import { SecurityApi } from '@core/authentication/service/security.api';
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import { BrowserService } from '@core/browser/browser.service';
import { RegistryConfig } from '@core/config/registry.config';
import { LanguageService } from '@core/language/language.service';
import { PreferencesApi } from '@core/registry/state/preferences.api';
import { ProjectApi } from '@core/registry/state/project.api';
import { SessionStore } from '@core/registry/state/session.store';
import { UiFacade } from '@core/registry/state/ui.facade';
import { UserApi } from '@core/registry/state/user.api';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { ProjectHelper } from '@shared/helpers/project.helper';
import { REDIRECT_URI } from '@shared/helpers/request.helper';
import { RouteHelper } from '@shared/helpers/route.helper';
import { eager, initialize, reportError } from '@shared/helpers/rx.helper';
import { SessionStorageUtils } from '@shared/helpers/session-storage.helper';
import { StateHelper } from '@shared/helpers/state/state.helper';
import { ProfileResetService } from '@shared/helpers/store/profile-reset.service';
import { selectState } from '@shared/helpers/store/state-observable.helper';
import { THEME_CHOICES } from '@shared/helpers/theme-choices.const';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { RefreshModeEnum } from '@shared/models/enumeration/refresh-mode.enum';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { ThemeEnum } from '@shared/models/enumeration/theme.enum';
import { CurrentUserModel } from '@shared/models/model/current-user.model';
import { ErrorModel } from '@shared/models/model/error.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { ThemeChoiceModel } from '@shared/models/model/theme-choice.model';

const UNAUTHORIZED_STATUS = 401;

/**
 * Purpose: Point d'entrée public de l'utilisateur connecté et de sa session : connexion et déconnexion, utilisateur courant, projet sélectionné, préférences de thème et de langue.
 * Scope: Expose le store de session sous forme de signals, appelle le backend pour les flux de session et applique le thème et la langue de l'utilisateur à la coque.
 * Limits: Ne gère pas les profils de projet ni les invitations de l'utilisateur ; la facade des profils utilisateur le fait.
 */
@Injectable({ providedIn: 'root' })
export class SessionFacade {
	private readonly session: InstanceType<typeof SessionStore> = inject(SessionStore);
	private readonly uiFacade = inject(UiFacade);
	private readonly languageService = inject(LanguageService);
	private readonly router = inject(Router);
	private readonly browser = inject(BrowserService);
	private readonly profileReset = inject(ProfileResetService);

	private readonly securityApi = inject(SecurityApi);
	private readonly projectApi = inject(ProjectApi);
	private readonly preferencesApi = inject(PreferencesApi);
	private readonly userApi = inject(UserApi);

	private pendingProject: { subscription: Subscription; done: ReplaySubject<void> } | undefined = undefined;

	public readonly currentUser: Signal<CurrentUserModel | undefined> = this.session.currentUser;
	public readonly currentUser$ = selectState(
		this.session,
		(state: { currentUser: CurrentUserModel | undefined }) => state.currentUser,
	).pipe(filter((it): it is CurrentUserModel => GenericHelper.nonNull(it)));

	public readonly currentUserTheme = this.uiFacade.theme;
	public readonly themeChoices: readonly ThemeChoiceModel[] = THEME_CHOICES;
	public readonly currentUserRefreshMode = this.uiFacade.refreshMode;
	public readonly currentUserLanguage = computed(
		() => this.currentUser()?.preferences?.language ?? RegistryConfig.config.defaultLanguage,
	);
	public readonly availableLanguages: readonly string[] = RegistryConfig.config.languages;
	public readonly pendingLanguage = this.uiFacade.pendingLanguage;

	public readonly selectedProject = computed(() => this.session.currentProject.project());
	public readonly currentProjectId = this.session.currentProject.id;

	public selectedProjectHasOption(option: ProjectOptionEnum): Signal<boolean> {
		return computed(() => this.hasSelectedOption(option));
	}

	private hasSelectedOption(option: ProjectOptionEnum): boolean {
		const project = this.selectedProject();
		return GenericHelper.nonNull(project) && ProjectHelper.hasOption(project, option);
	}

	public redirectToLogin(): void {
		const current = this.browser.relativeUrl;
		if (!current.includes(RegistryRouteEnum.LOGIN) && !current.includes(RegistryRouteEnum.AUTH_CALLBACK)) {
			SessionStorageUtils.set(REDIRECT_URI, current);
		}
		this.session.reset();
		this.router.navigateByUrl(RouteHelper.absolute(RegistryRouteEnum.LOGIN));
	}

	public login(): void {
		this.session.reset();

		this.securityApi
			.getLoginUri(`${this.browser.origin}/${RegistryRouteEnum.AUTH_CALLBACK}`)
			.pipe(
				tap((uri) => this.browser.redirect(uri.uri)),
				catchError((error: ErrorModel) => this.globalError$(error)),
			)
			.subscribe();
	}

	public logout(): void {
		this.securityApi
			.getLogoutUri(this.browser.origin)
			.pipe(
				tap((uri) => this.browser.redirect(uri.uri)),
				catchError((error: ErrorModel) => this.globalError$(error)),
			)
			.subscribe();
	}

	public exportAccount(): void {
		this.userApi
			.exportCurrentUser()
			.pipe(
				tap((data) => this.browser.downloadJson(data, 'registry-my-data.json')),
				catchError((error: ErrorModel) => this.reportError$(error)),
			)
			.subscribe();
	}

	public deleteAccount(): void {
		this.userApi
			.deleteCurrentUser()
			.pipe(
				tap(() => this.logout()),
				catchError((error: ErrorModel) => this.reportError$(error)),
			)
			.subscribe();
	}

	public refreshToken(): Observable<void> {
		return this.securityApi.refreshToken();
	}

	public fetchToken(authorizationCode: string): void {
		this.securityApi
			.fetchToken({
				authorizationCode: authorizationCode,
				redirectUri: `${this.browser.origin}/${RegistryRouteEnum.AUTH_CALLBACK}`,
			})
			.pipe(
				mergeMap(() => this.securityApi.fetchCurrentUser()),
				tap((currentUser) => this.onCurrentUser(currentUser)),
				tap(() => this.navigateAfterSignIn()),
				catchError((error: ErrorModel) => this.signInFailed$(error)),
			)
			.subscribe();
	}

	public fetchCurrentUser(): Observable<void> {
		return eager(
			this.securityApi.fetchCurrentUser().pipe(
				tap((currentUser) => this.onCurrentUser(currentUser)),
				map((): void => undefined),
				catchError((error: ErrorModel) => this.globalErrorCompleted$(error)),
			),
		);
	}

	public updateCurrentUserTheme(theme: ThemeEnum | undefined): void {
		if (GenericHelper.isNull(theme) || theme === this.uiFacade.theme()) return;

		this.uiFacade.updateTheme(theme);
		this.preferencesApi
			.updateTheme(CurrentUserHelper.mapThemeToString(theme))
			.pipe(
				tap((preferences) => this.session.setCurrentUserTheme(preferences.theme)),
				catchError((error: ErrorModel) => this.themeSaveFailed$(error)),
			)
			.subscribe();
	}

	public updateCurrentUserRefreshMode(refreshMode: RefreshModeEnum): void {
		if (refreshMode === this.uiFacade.refreshMode()) return;

		this.uiFacade.updateRefreshMode(refreshMode);
		this.preferencesApi
			.updateRefreshMode(refreshMode)
			.pipe(
				tap((preferences) => this.session.setCurrentUserRefreshMode(preferences.refreshMode)),
				catchError((error: ErrorModel) => this.reportError$(error)),
			)
			.subscribe();
	}

	public updateCurrentUserLanguage(language: string): void {
		if (language === this.currentUserLanguage()) return;

		this.preferencesApi
			.updateLanguage(language)
			.pipe(
				initialize(() => this.uiFacade.startLanguageChange(language)),
				tap(() => this.languageService.remember(language)),
				tap(() => this.browser.reload()),
				catchError((error: ErrorModel) => this.languageChangeFailed$(error)),
			)
			.subscribe();
	}

	public setCurrentProject(projectId: string | undefined): Observable<void> {
		this.profileReset.resetAll();
		this.releasePendingProject();
		this.session.setCurrentProject(projectId, undefined);

		if (GenericHelper.isNull(projectId)) {
			return of(undefined);
		}

		const done = new ReplaySubject<void>(1);
		const subscription = this.fetchProject$(projectId).subscribe(done);
		this.pendingProject = { subscription: subscription, done: done };

		return done.asObservable();
	}

	public toggleSelectedProjectFavorite(): void {
		const project = this.selectedProject();
		if (GenericHelper.isNull(project)) return;

		const favorite = !project.favorite;
		this.projectApi
			.setFavoriteById(project.id, favorite)
			.pipe(
				tap(() => this.applySelectedProjectFavorite(project, favorite)),
				catchError((error: ErrorModel) => this.reportError$(error)),
			)
			.subscribe();
	}

	public refreshCurrentProject(): void {
		const projectId = this.currentProjectId();
		if (GenericHelper.isNull(projectId)) return;

		this.projectApi
			.findProjectById(projectId)
			.pipe(
				tap((project) => this.applyFetchedProject(projectId, project)),
				catchError(() => EMPTY),
			)
			.subscribe();
	}

	private fetchProject$(projectId: string): Observable<void> {
		return this.projectApi.findProjectById(projectId).pipe(
			tap((project) => this.session.setCurrentProject(projectId, project)),
			map((): void => undefined),
			catchError((error: ErrorModel) => this.globalErrorCompleted$(error)),
		);
	}

	private onCurrentUser(currentUser: CurrentUserModel): void {
		this.session.setCurrentUser(currentUser);

		const userTheme = CurrentUserHelper.mapThemeToEnum(currentUser.preferences.theme);
		if (userTheme !== this.uiFacade.theme()) {
			this.uiFacade.updateTheme(userTheme);
		}

		this.uiFacade.updateRefreshMode(CurrentUserHelper.mapRefreshModeToEnum(currentUser.preferences.refreshMode));

		const userLanguage: string | undefined = currentUser.preferences.language;
		if (GenericHelper.nonNull(userLanguage) && userLanguage !== this.languageService.activeLanguage) {
			this.applyUserLanguage(userLanguage);
		}
	}

	private applyUserLanguage(language: string): void {
		this.languageService
			.apply(language)
			.pipe(
				switchMap(() => this.fetchCurrentUser()),
				catchError((error: ErrorModel) => this.reportError$(error)),
			)
			.subscribe();
	}

	private navigateAfterSignIn(): void {
		const redirectUri = (SessionStorageUtils.get(REDIRECT_URI) as string | undefined) ?? RegistryRouteEnum.HOME;
		this.router
			.navigateByUrl(
				!redirectUri.includes(RegistryRouteEnum.AUTH_CALLBACK) ? redirectUri : RegistryRouteEnum.HOME,
				{ replaceUrl: true },
			)
			.then(() => SessionStorageUtils.delete(REDIRECT_URI));
	}

	private releasePendingProject(): void {
		if (this.pendingProject) {
			this.pendingProject.subscription.unsubscribe();
			this.pendingProject.done.next(undefined);
			this.pendingProject.done.complete();
			this.pendingProject = undefined;
		}
	}

	private globalError$(error: ErrorModel): Observable<never> {
		this.showGlobalError(error);
		return EMPTY;
	}

	private globalErrorCompleted$(error: ErrorModel): Observable<void> {
		this.showGlobalError(error);
		return of(undefined);
	}

	private showGlobalError(error: ErrorModel): void {
		if (error.status !== UNAUTHORIZED_STATUS) {
			this.uiFacade.setGlobalError(error);
		}
	}

	private languageChangeFailed$(error: ErrorModel): Observable<never> {
		this.uiFacade.stopLanguageChange();
		return this.reportError$(error);
	}

	private themeSaveFailed$(error: ErrorModel): Observable<never> {
		this.notifyThemeNotSaved(error);
		return EMPTY;
	}

	private notifyThemeNotSaved(error: ErrorModel): void {
		this.uiFacade.notify(
			StateHelper.buildNotificationMessage(
				SeverityEnum.ERROR,
				'global.notifications.THEME_SAVE_FAILED.title',
				'global.notifications.THEME_SAVE_FAILED.message',
				{ reason: error.message },
			),
		);
	}

	// Un code d'autorisation refusé (expiré ou déjà utilisé) renvoie l'utilisateur vers la page de connexion : dire pourquoi.
	private signInFailed$(error: ErrorModel): Observable<never> {
		if (error.status !== HttpStatusCode.Unauthorized) return this.globalError$(error);
		this.uiFacade.notify(
			StateHelper.buildNotificationMessage(
				SeverityEnum.WARNING,
				'global.notifications.sign-in-refused.title',
				'global.notifications.sign-in-refused.message',
			),
		);
		return EMPTY;
	}

	private applySelectedProjectFavorite(project: ProjectModel, favorite: boolean): void {
		if (this.currentProjectId() === project.id)
			this.session.setCurrentProject(project.id, { ...project, favorite });
	}

	private reportError$(error: ErrorModel): Observable<never> {
		reportError(this.uiFacade, error);
		return EMPTY;
	}

	private applyFetchedProject(projectId: string, project: ProjectModel): void {
		if (this.currentProjectId() === projectId) this.session.setCurrentProject(projectId, project);
	}
}
