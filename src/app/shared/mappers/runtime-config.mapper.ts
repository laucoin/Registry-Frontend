import { RuntimeConfigModel } from '@shared/models/runtime-config.model';

export type RuntimeConfigResponse = RuntimeConfigModel;

export class RuntimeConfigMapper {
	public static toModel(response: RuntimeConfigResponse): RuntimeConfigModel {
		return { ...response };
	}
}
