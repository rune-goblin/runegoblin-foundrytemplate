import { mount, unmount } from 'svelte';
import Example from './Example.svelte';

const { ApplicationV2 } = foundry.applications.api;

export class ExampleApp extends ApplicationV2 {
  static override DEFAULT_OPTIONS = {
    id: 'pf2e-module-template-example',
    tag: 'section',
    classes: ['pf2e-module-template'],
    window: { title: 'PF2e Module Template', icon: 'fa-solid fa-flask', resizable: false },
    position: { width: 420, height: 'auto' as const },
  };

  #component?: ReturnType<typeof mount>;

  static open(): ExampleApp {
    const app = new ExampleApp();
    app.render({ force: true });
    return app;
  }

  protected override async _renderHTML(): Promise<HTMLElement> {
    const target = document.createElement('div');
    this.#component = mount(Example, { target, props: { app: this } });
    return target;
  }

  protected override _replaceHTML(result: HTMLElement, content: HTMLElement): void {
    content.replaceChildren(result);
  }

  protected override async _preClose(): Promise<void> {
    if (this.#component) {
      unmount(this.#component);
      this.#component = undefined;
    }
  }
}
