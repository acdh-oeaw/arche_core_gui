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
    
    window.getSearchParamsFromUrl = function (url) {
        var paramsString = "";
        if (url.split('/browser/discover?')[1]) {
            paramsString = url.split('/browser/discover?')[1];
        } else {
            paramsString = url.split('/browser/discover/')[1];
        }
        paramsString = paramsString.replace('?q', 'q');
        window.guiObj = {};
        window.guiObj = window.parseQueryString(paramsString);
        window.firstLoad = false;
    }

    /**
     * This function converts back the query string from the url into an object to the smartsearch api
     * -- if we copy pasted the result url
     * @param {type} queryString
     * @returns {unresolved}
     */
    window.parseQueryString = function (queryString) {
    //function parseQueryString(queryString) {
        var myArray = [];
        myArray = [];
        var pairs = queryString.split('&');
        pairs.forEach(function (pair) {
            var parts = pair.split('=');
            var key = decodeURIComponent(parts[0]);
            var value = decodeURIComponent(parts[1]);
            
            // Handle array values within brackets
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',');
                /*
                 * The sarchin first version was an array with multiple elements
                 * but now we allow  only one and it is still an array so we have to take
                 * the first element
                 */
                if(key === 'searchIn') {
                    value = value[0];
                }
            }
            // Handle nested keys
            if (key.includes('[')) {
                var keys = key.split(/[\[\]]+/).filter(Boolean);
                var current = myArray;

                for (var i = 0; i < keys.length; i++) {
                    var nestedKey = keys[i];
                    if (i === keys.length - 1) {
                        current[nestedKey] = value;
                    } else {
                        current[nestedKey] = current[nestedKey] || {};
                        current = current[nestedKey];
                    }
                }
            } else {
                myArray[key] = value;
            }
        });
        return myArray;
    }
});
