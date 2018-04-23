import { displayGif } from "../lib/gif.js";

customElements.define("app-root",
	class extends HTMLElement {
		static get observedAttributes(){
			return [];
		}
		constructor(){
			super();
			this.bind(this);
		}
		bind(element){
			element.attachEvents = element.attachEvents.bind(element);
			element.cacheDom = element.cacheDom.bind(element);
		}
		async connectedCallback(){
			this.cacheDom();
			this.attachEvents();
			const res = await fetch("/img/crate.gif");
			//const res = await fetch("/img/sample_1.gif");
			const buffer = await res.arrayBuffer();
			const canvas = displayGif(buffer);
			this.appendChild(canvas);
		}
		cacheDom(){
			this.dom = {};
		}
		attachEvents(){

		}
		attributeChangedCallback(name, oldValue, newValue){
			this[name] = newValue;
		}
	}
)
