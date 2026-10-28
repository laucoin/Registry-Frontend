import { RefreshService } from '@shared/helpers/refresh/refresh.service'

/** Substitut du service de rafraîchissement dans les specs de composants : n'enregistre rien et ne recharge jamais. */
export const REFRESH_SERVICE_STUB: { provide: typeof RefreshService, useValue: Pick<RefreshService, 'register' | 'check'> } = {
	provide: RefreshService,
	useValue: { register: (): (() => void) => (): void => undefined, check: (): void => undefined },
}
