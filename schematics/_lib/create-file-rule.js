'use strict';

const { strings, SchematicsException } = require('@angular-devkit/schematics');

function createFileRule(options, { suffix, defaultPath, render }) {
	const path = options.path ?? defaultPath;
	const dasherizedName = strings.dasherize(options.name);
	const classifiedName = `${strings.classify(options.name)}${strings.classify(suffix)}`;
	const targetPath = `${path}/${dasherizedName}.${suffix}.ts`;

	return (tree) => {
		if (tree.exists(targetPath)) {
			throw new SchematicsException(`File ${targetPath} already exists.`);
		}
		tree.create(targetPath, render(classifiedName));
		return tree;
	};
}

exports.createFileRule = createFileRule;
