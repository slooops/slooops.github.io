import type { Meta, StoryObj } from '@storybook/angular';
import { ModalShellComponent } from './modal-shell.component';

const meta: Meta<ModalShellComponent> = {
  title: 'Atoms/ModalShell',
  component: ModalShellComponent,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title displayed in the modal header',
    },
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is visible',
    },
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<ModalShellComponent>;

export const Closed: Story = {
  args: {
    title: 'Modal Title',
    isOpen: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="padding: 2rem;">
        <p>Modal is closed. Set isOpen to true to see it.</p>
        <app-modal-shell [title]="title" [isOpen]="isOpen">
          <p>Modal content goes here</p>
        </app-modal-shell>
      </div>
    `,
  }),
};

export const Open: Story = {
  args: {
    title: 'Confirm Action',
    isOpen: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <app-modal-shell [title]="title" [isOpen]="isOpen">
        <p>Are you sure you want to proceed with this action?</p>
        <div style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
          <button style="padding: 0.5rem 1rem; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;">Cancel</button>
          <button style="padding: 0.5rem 1rem; border: none; background: #049fd9; color: white; border-radius: 4px; cursor: pointer;">Confirm</button>
        </div>
      </app-modal-shell>
    `,
  }),
};

export const WithForm: Story = {
  args: {
    title: 'Add New User',
    isOpen: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <app-modal-shell [title]="title" [isOpen]="isOpen">
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="display: block; margin-bottom: 0.25rem; font-weight: 500;">Username</label>
            <input type="text" placeholder="Enter username" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;" />
          </div>
          <div>
            <label style="display: block; margin-bottom: 0.25rem; font-weight: 500;">Email</label>
            <input type="email" placeholder="Enter email" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;" />
          </div>
          <div>
            <label style="display: block; margin-bottom: 0.25rem; font-weight: 500;">Role</label>
            <select style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
              <option>Select role...</option>
              <option>Admin</option>
              <option>User</option>
              <option>Viewer</option>
            </select>
          </div>
        </div>
        <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
          <button style="padding: 0.5rem 1rem; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;">Cancel</button>
          <button style="padding: 0.5rem 1rem; border: none; background: #049fd9; color: white; border-radius: 4px; cursor: pointer;">Save User</button>
        </div>
      </app-modal-shell>
    `,
  }),
};

export const LongContent: Story = {
  args: {
    title: 'Terms and Conditions',
    isOpen: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <app-modal-shell [title]="title" [isOpen]="isOpen">
        <div style="max-height: 300px; overflow-y: auto;">
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
          <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        </div>
        <div style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
          <button style="padding: 0.5rem 1rem; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;">Decline</button>
          <button style="padding: 0.5rem 1rem; border: none; background: #049fd9; color: white; border-radius: 4px; cursor: pointer;">Accept</button>
        </div>
      </app-modal-shell>
    `,
  }),
};
