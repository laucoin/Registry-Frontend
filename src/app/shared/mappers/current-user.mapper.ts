import { CurrentUserModel } from '@shared/models/current-user.model';

export type CurrentUserResponse = Omit<CurrentUserModel, 'lastLogin'> & {
	lastLogin: string | undefined;
};

export class CurrentUserMapper {
	public static toModel(response: CurrentUserResponse): CurrentUserModel {
		return {
			...response,
			lastLogin: response.lastLogin ? new Date(response.lastLogin) : undefined,
		};
	}
}
