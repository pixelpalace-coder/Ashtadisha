/**
 * Component Loader Module
 * Loads external HTML components into the DOM.
 */

export class ComponentLoader {
  constructor(containerId = 'app-root') {
    this.container = document.getElementById(containerId);
    this.components = [
      'hero',
      'about',
      'seven-sisters',
      'state-assam',
      'state-meghalaya',
      'state-nagaland',
      'state-manipur',
      'state-mizoram',
      'state-tripura',
      'state-arunachal',
      'state-sikkim',
      'food',
      'shopping',
      'when',
      'ai-planner',
      'booking',
      'footer'
    ];
  }

  /**
   * Loads all registered components sequentially.
   */
  async loadAll() {
    console.log('Starting component load...');
    
    for (const name of this.components) {
      try {
        const response = await fetch(`components/${name}.html`);
        if (!response.ok) throw new Error(`Failed to load ${name}`);
        
        const html = await response.text();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Append all children to container
        while (tempDiv.firstChild) {
          this.container.appendChild(tempDiv.firstChild);
        }
      } catch (error) {
        console.error(`Error loading component [${name}]:`, error);
      }
    }

    console.log('All components loaded.');
    // Dispatch event to notify that DOM is ready for animations/logic
    document.dispatchEvent(new CustomEvent('componentsLoaded'));
  }
}
