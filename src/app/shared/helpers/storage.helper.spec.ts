import { beforeEach, describe, expect, it } from 'vitest';

import { SessionStorageUtils } from '@shared/helpers/session-storage.helper';
import { StorageUtils } from '@shared/helpers/storage.helper';

describe('StorageUtils', () => {
	beforeEach(() => {
		localStorage.clear();
		sessionStorage.clear();
	});

	it.each([
		{ name: 'a string as it is', value: 'hello' as unknown },
		{ name: 'an object as JSON', value: { a: 1 } as unknown },
	])('stores and reads back $name', ({ value }) => {
		// Arrange
		StorageUtils.set(localStorage, 'key', value);

		// Act
		const read = StorageUtils.get(localStorage, 'key');

		// Assert
		expect(read).toEqual(value);
	});

	it('stores nothing meaningful for a value that is neither text nor object', () => {
		// Arrange
		StorageUtils.set(localStorage, 'number', 42);

		// Act
		const stored = StorageUtils.get(localStorage, 'number');

		// Assert
		expect(stored).toBe('');
	});

	it.each([
		{ name: 'a key holding a value', key: 'present', expected: true },
		{ name: 'a missing key', key: 'absent', expected: false },
	])('reports $name', ({ key, expected }) => {
		// Arrange
		StorageUtils.set(localStorage, 'present', 'x');

		// Act
		const result = StorageUtils.check(localStorage, key);

		// Assert
		expect(result).toBe(expected);
	});

	it('deletes a key', () => {
		// Arrange
		StorageUtils.set(localStorage, 'gone', 'x');

		// Act
		StorageUtils.delete(localStorage, 'gone');

		// Assert
		expect(StorageUtils.check(localStorage, 'gone')).toBe(false);
	});

	it('clears everything except the kept keys, restoring them', () => {
		// Arrange
		StorageUtils.set(localStorage, 'keep', 'k');
		StorageUtils.set(localStorage, 'keepObject', { a: 1 });
		StorageUtils.set(localStorage, 'drop', 'd');

		// Act
		StorageUtils.clear(localStorage, ['keep', 'keepObject']);

		// Assert
		expect(StorageUtils.get(localStorage, 'keep')).toBe('k');
		expect(StorageUtils.get(localStorage, 'keepObject')).toEqual({ a: 1 });
		expect(StorageUtils.check(localStorage, 'drop')).toBe(false);
	});

	it('does not restore a kept key that held no value', () => {
		// Arrange
		StorageUtils.set(localStorage, 'drop', 'd');

		// Act
		StorageUtils.clear(localStorage, ['missing']);

		// Assert
		expect(StorageUtils.check(localStorage, 'missing')).toBe(false);
		expect(StorageUtils.check(localStorage, 'drop')).toBe(false);
	});

	it('clears everything when nothing is kept', () => {
		// Arrange
		StorageUtils.set(localStorage, 'a', '1');

		// Act
		StorageUtils.clear(localStorage);

		// Assert
		expect(localStorage.length).toBe(0);
	});

	it('keeps the session storage apart from the local storage', () => {
		// Arrange
		SessionStorageUtils.set('redirect', '/projects');

		// Act
		const results = [
			SessionStorageUtils.get('redirect'),
			SessionStorageUtils.check('redirect'),
			localStorage.getItem('redirect'),
		];
		SessionStorageUtils.clear([]);

		// Assert
		expect(results).toEqual(['/projects', true, null]);
		expect(sessionStorage.length).toBe(0);
	});
});
