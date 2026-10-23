import { RefreshService } from '@shared/helpers/refresh/refresh.service'

/** Stand-in for the refresh service in component specs: registers nothing and never reloads. */
export const REFRESH_SERVICE_STUB: { provide: typeof RefreshService, useValue: Pick<RefreshService, 'register' | 'check'> } = {
	provide: RefreshService,
	useValue: { register: (): (() => void) => (): void => undefined, check: (): void => undefined },
}
