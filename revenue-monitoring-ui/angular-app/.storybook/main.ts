import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
  ],
  framework: {
    name: '@storybook/angular',
    options: {
      project: 'accruals-monitoring-ui',
      browserTarget: 'accruals-monitoring-ui:build',
    },
  },
  staticDirs: ['../src/assets'],
  core: {
    disableTelemetry: true,
  },
  typescript: {
    // Suppress "unused file" warnings - we're in a large app, not all files have stories
    skipCompiler: false,
  },
};

export default config;
