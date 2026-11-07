import { describe, expect, it, Mock, vi } from 'vitest';

import { ProfileResetService } from './profile-reset.service';

describe('ProfileResetService', () => {
	it('runs registered resets until unregistered', () => {
		// Arrange
		const service = new ProfileResetService();
		const reset: Mock<() => void> = vi.fn();
		const unregister = service.register(reset);

		// Act
		service.resetAll();
		unregister();
		service.resetAll();

		// Assert
		expect(reset).toHaveBeenCalledTimes(1);
	});
});
