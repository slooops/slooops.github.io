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
} from '@angular-devkit/schematics';
import { normalize, strings } from '@angular-devkit/core';

export interface MonitoringDashboardOptions {
  name: string;
  title?: string;
  selectorPrefix?: string;
  assignmentFilterKey?: string;
  path?: string;
  skipTests?: boolean;
}

function titleCase(input: string): string {
  return input
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function (options: MonitoringDashboardOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
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
      renameTemplateFiles(),
      template(templateOptions),
      move(componentPath),
    ]);

    return mergeWith(sourceParametrized)(tree, context);
  };
}
