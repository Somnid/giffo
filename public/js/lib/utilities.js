"use strict";
const Util = (function(){
        function raiseEvent(element, eventName, payload){
            const event = document.createEvent("HTMLEvents");
            event.initEvent(eventName, true, true);
            event.data = payload;
            element.dispatchEvent(event);
        }
		function camelCase(text) {
            return text.replace(/-([a-z])/g, g => g[1].toUpperCase());
        }
		
		return {
			raiseEvent,
			camelCase
		};
})();