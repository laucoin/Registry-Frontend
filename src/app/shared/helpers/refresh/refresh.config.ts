import { RefreshKindEnum } from '@shared/models/enumeration/refresh-kind.enum';
import { RefreshModeEnum } from '@shared/models/enumeration/refresh-mode.enum';

const SECOND = 1000;

/** Délai minimal entre deux rechargements automatiques d'une source, par mode. `undefined` signifie aucun rechargement périodique. */
export const REFRESH_INTERVALS: Readonly<
	Record<RefreshModeEnum, Readonly<Record<RefreshKindEnum, number | undefined>>>
> = {
	[RefreshModeEnum.OFF]: {
		[RefreshKindEnum.LIVE]: undefined,
		[RefreshKindEnum.COUNTS]: undefined,
		[RefreshKindEnum.DAY_BOUND]: undefined,
	},
	[RefreshModeEnum.ECO]: {
		[RefreshKindEnum.LIVE]: 180 * SECOND,
		[RefreshKindEnum.COUNTS]: 300 * SECOND,
		[RefreshKindEnum.DAY_BOUND]: undefined,
	},
	[RefreshModeEnum.NORMAL]: {
		[RefreshKindEnum.LIVE]: 60 * SECOND,
		[RefreshKindEnum.COUNTS]: 120 * SECOND,
		[RefreshKindEnum.DAY_BOUND]: undefined,
	},
	[RefreshModeEnum.FAST]: {
		[RefreshKindEnum.LIVE]: 30 * SECOND,
		[RefreshKindEnum.COUNTS]: 60 * SECOND,
		[RefreshKindEnum.DAY_BOUND]: undefined,
	},
};

/** Période de la vérification globale ; le plus court intervalle ci-dessus doit rester un multiple de celle-ci. */
export const REFRESH_TICK_MS = 5 * SECOND;
