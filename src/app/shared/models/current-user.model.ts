export interface CurrentUserModel {
	id: string;
	email: string | undefined;
	firstName: string | undefined;
	lastName: string | undefined;
	role: RoleModel | undefined;
	lastLogin: Date | undefined;
}

interface RoleModel {
	value: string;
	label: string;
}
