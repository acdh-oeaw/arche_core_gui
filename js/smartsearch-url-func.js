jQuery(function ($) {
   
     $(document).ready(function () {
         
     });
    
    
      /**
     * Get the search param values from the guiObj
     * @param {type} prop
     * @returns {smartsearchL#1.guiObj|Array}
     */
    window.getGuiSearchParams = function (prop) {
        //function getGuiSearchParams(prop) {
        if (window.guiObj.hasOwnProperty(prop)) {
            return window.guiObj[prop];
        }
    }
});
