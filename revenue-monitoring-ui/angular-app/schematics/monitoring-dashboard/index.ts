import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  mergeWith,
  renameTemplateFiles,
  template,
  url,
  move,
  filter,
  noop,
  forEach,
} from '@angular-devkit/schematics';
import { normalize, strings } from '@angular-devkit/core';

export interface MonitoringDashboardOptions {
  name: string;
  title?: string;
  selectorPrefix?: string;
  assignmentFilterKey?: string;
  path?: string;
  skipTests?: boolean;
  'skip-tests'?: boolean;
}

function titleCase(input: string): string {
  return input
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function (options: MonitoringDashboardOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const skipTests = Boolean(options.skipTests ?? options['skip-tests']);
    const normalizedPath = normalize(options.path || 'src/app');
    const componentPath = `${normalizedPath}/${strings.dasherize(options.name)}`;

    // Use provided title or auto-derive from name
    const title = options.title || titleCase(options.name);

    // Default values
    const selectorPrefix = options.selectorPrefix || 'app-';
    const assignmentFilterKey =
      options.assignmentFilterKey || 'FILTER_KEY_PLACEHOLDER';

    // Template variables for substitution
    const templateOptions = {
      ...strings,
      name: options.name,
      title: title,
      selectorPrefix: selectorPrefix,
      assignmentFilterKey: assignmentFilterKey,
    };

    // Load and apply templates
    const sourceTemplates = url('./files');
    const sourceParametrized = apply(sourceTemplates, [
      skipTests
        ? filter((path) => {
            const includeFile = !path.endsWith('.spec.ts');
            if (includeFile) {
              context.logger.info(
                `[monitoring-dashboard] including template: ${path}`,
              );
            } else {
              context.logger.info(
                `[monitoring-dashboard] skipping test template: ${path}`,
              );
            }
            return includeFile;
          })
        : noop(),
      !skipTests
        ? forEach((entry) => {
            context.logger.info(
              `[monitoring-dashboard] including template: ${entry.path}`,
            );
            return entry;
          })
        : noop(),
      renameTemplateFiles(),
      template(templateOptions),
      move(componentPath),
    ]);

    return mergeWith(sourceParametrized)(tree, context);
  };
}
