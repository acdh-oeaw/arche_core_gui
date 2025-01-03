jQuery(function ($) {
    /**
     * Parses the query string for the URL into a smartsearch configuration object
     * @param {type} queryString
     */
    window.parseQueryString = function (queryString) {
        var param = window.getSearchParamBase();
        var urlParams = new URLSearchParams(queryString.replace(/^[/?]+/, ''));
        urlParams.forEach(function (value, key) {
            if (!key.includes('[')) {
                param[key] = value;
            } else {
                // Handle nested keys
                var keys = key.replace(']', '').split('[');
                var current = param;
                var nestedKey;
                while (keys.length > 1) {
                    nestedKey = keys.shift();
                    current[nestedKey] = current[nestedKey] || [];
                    current = current[nestedKey];
                }
                nestedKey = keys.shift();
                if (nestedKey === '') {
                    current.push(value);
                } else {
                    current[nestedKey] = value;
                }
            }
        });
        return param;
    }
});
