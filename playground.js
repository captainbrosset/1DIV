class CSSPlayground extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({
      mode: 'open'
    });

    this.divEl = document.createElement('div');
    this.divEl.classList.add('a');
    shadowRoot.appendChild(this.divEl);

    this.styleSheet = new CSSStyleSheet();
    shadowRoot.adoptedStyleSheets = [this.styleSheet];
  }

  set css(cssText) {
    this.styleSheet.replaceSync(cssText);
  }
}

customElements.define('css-playground', CSSPlayground);
