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
   * Loads all registered components in parallel for maximum speed.
   */
  async loadAll() {
    console.log('Starting parallel component load...');
    
    // Create fetch promises for all components simultaneously
    const fetchPromises = this.components.map(name => 
      fetch(`components/${name}.html`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status} for ${name}`);
          return res.text();
        })
        .catch(err => {
          console.error(`Error fetching component [${name}]:`, err);
          return null; // Return null so we can filter failed ones later
        })
    );

    // Wait for all fetches to finish
    const results = await Promise.all(fetchPromises);

    // Inject them into the DOM IN ORDER
    results.forEach((html, index) => {
      if (html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Append all children to container
        while (tempDiv.firstChild) {
          this.container.appendChild(tempDiv.firstChild);
        }
      }
    });

    console.log('All components synchronized and injected.');
    // Dispatch event to notify that DOM is ready for animations/logic
    document.dispatchEvent(new CustomEvent('componentsLoaded'));
  }
}
