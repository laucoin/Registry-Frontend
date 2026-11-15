import { WritableSignal } from '@angular/core';

import { catchError, defer, EMPTY, finalize, Observable, ReplaySubject } from 'rxjs';

import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { ErrorModel } from '@shared/models/model/error.model';
import { NotificationModel } from '@shared/models/model/notification.model';

/**
 * Objectif: Contrat de ce que les stores et facades utilisent pour signaler un échec à l'utilisateur.
 * Périmètre: Propose le toast de notification.
 * Limites: Déclare uniquement la commande ; les implémentations vivent dans l'état de l'UI.
 */
export interface ErrorSink {
	notify(message: NotificationModel): void;
}

/**
 * Objectif: Exécute un callback à chaque abonnement à la source.
 * Périmètre: Diffère l'abonnement pour que le callback s'exécute d'abord.
 * Limites: N'exécute rien quand la source se termine ; utiliser finalize pour cela.
 */
export const initialize =
	(onSubscribe: () => void) =>
	<T>(source: Observable<T>): Observable<T> =>
		defer(() => {
			onSubscribe();
			return source;
		});

/**
 * Objectif: Borne un drapeau de chargement à une source.
 * Périmètre: Lève le drapeau à l'abonnement et l'abaisse quand la source se termine, échoue ou est annulée.
 * Limites: Ne gère pas l'erreur ; la source échoue toujours.
 */
export const withLoading =
	(loading: WritableSignal<boolean>) =>
	<T>(source: Observable<T>): Observable<T> =>
		defer(() => {
			loading.set(true);
			return source.pipe(finalize(() => loading.set(false)));
		});

const UNAUTHORIZED_STATUS = 401;

/**
 * Objectif: Affiche un échec à l'utilisateur.
 * Périmètre: Lève un toast d'erreur persistant, sauf pour un 401 : l'intercepteur renvoie déjà vers la connexion.
 * Limites: N'arrête ni ne récupère le flux ; l'appelant le fait. Seule une erreur du backend montre son titre et son message ; une exception locale laisse le toast afficher le message générique.
 */
export const reportError = (errorSink: ErrorSink, error: ErrorModel): void => {
	if (error.status === UNAUTHORIZED_STATUS) return;
	errorSink.notify({ severity: SeverityEnum.ERROR, ...backendText(error), closable: true, sticky: true });
};

function backendText(error: unknown): Pick<NotificationModel, 'summary' | 'detail'> {
	if (!(error instanceof ErrorModel)) return {};
	return { summary: error.title ?? 'global.notifications.UNKNOWN_ERROR.title', detail: error.message };
}

function reportAndComplete(errorSink: ErrorSink, error: ErrorModel): Observable<never> {
	reportError(errorSink, error);
	return EMPTY;
}

/**
 * Objectif: Signale une source en échec et la termine sans rien émettre.
 * Périmètre: Affiche un toast.
 * Limites: Ne réessaie pas.
 */
export const notifyOnError =
	(errorSink: ErrorSink) =>
	<T>(source: Observable<T>): Observable<T> =>
		source.pipe(catchError((error: ErrorModel) => reportAndComplete(errorSink, error)));

/**
 * Objectif: Abandonne l'échec d'une source et la termine sans rien émettre.
 * Périmètre: Laisse un rafraîchissement en arrière-plan échouer sans toast ni état d'erreur.
 * Limites: Ne signale rien ; l'appelant réessaie selon son propre calendrier.
 */
export const ignoreError =
	() =>
	<T>(source: Observable<T>): Observable<T> =>
		source.pipe(catchError(() => EMPTY));

/**
 * Objectif: Exécute une source immédiatement, comme une action dispatchée.
 * Périmètre: Rejoue l'issue aux appelants, qui peuvent l'ignorer ou s'y enchaîner.
 * Limites: N'annule pas la source quand les appelants se désabonnent.
 */
export const eager = <T>(source: Observable<T>): Observable<T> => {
	const result = new ReplaySubject<T>();
	source.subscribe(result);
	return result.asObservable();
};
