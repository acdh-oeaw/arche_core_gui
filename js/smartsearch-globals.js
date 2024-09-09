jQuery(function ($) {

    window.selectedSearchValues = [];
    window.firstLoad = true;
    window.token = 1;
    window.previousUrls = JSON.parse(sessionStorage.getItem('urls')) || [];
    window.popstateActive = sessionStorage.getItem('popstate') || false;
    window.bbox = null;
    window.map = null;
    window.preferredLang = drupalSettings.arche_core_gui.gui_lang;
    window.archeBaseUrl = getInstanceUrl();
    window.actualPage = 1;
    window.guiObj = {};
    window.bboxObj = {};
    var nmsp = [
        {prefix: 'https://vocabs.acdh.oeaw.ac.at/schema#', alias: 'acdh'},
        {prefix: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#', alias: 'rdf'}
    ];


    function getInstanceUrl() {
        var baseUrl = window.location.origin + window.location.pathname;
        return baseUrl.split("/browser")[0];
    }


    /* reset the searchUrl and remove the params */
    window.resetsearchUrl = function () {
        console.log("RESET SERACH URl:::");
        //function resetsearchUrl() {
        var currentUrl = window.location.href;
        var discoverIndex = currentUrl.indexOf('/discover/');
         var discoverIndexQ = currentUrl.indexOf('/discover?');
        if (discoverIndex !== -1) {
            currentUrl = currentUrl.substring(0, discoverIndex + '/discover/'.length);
            console.log("DISCOVER URL:: " + currentUrl);
        }
         if (discoverIndexQ !== -1) {
            currentUrl = currentUrl.substring(0, discoverIndex + '/discover?'.length);
            console.log("DISCOVER URL:: " + currentUrl);
        }
        history.pushState(null, "Discover", currentUrl);
    }


    /* reset search button clicked */
    window.resetSearch = function () {
    //function resetSearch() {
        window.guiObj = {};
        window.guiObj = {'actualPage': 1};
        window.resetsearchUrl();
        var url = window.location.href;

        // Find the position of the first '?'
        var indexOfQuestionMark = url.indexOf('?');

        // If there are query parameters, remove them
        if (indexOfQuestionMark !== -1) {
            // Get the URL without query parameters
            var newUrl = url.substring(0, indexOfQuestionMark);

            // Reload the page with the new URL
            window.location.href = newUrl;
        } else {
            // If no query parameters, simply reload the page
            window.location.reload();
        }
    }

    /**
     * Creates the new url params based on the search facets
     * @param {type} obj
     * @param {type} prefix
     * @returns {String}
     */
    function customParam(obj, prefix) {
        var queryString = '';

        $.each(obj, function (key, value) {
            var fullKey = prefix ? prefix + '[' + key + ']' : key;

            if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                // If the value is a nested object, recurse into it
                var nestedQuery = customParam(value, fullKey);
                if (nestedQuery) {
                    queryString += nestedQuery + '&';
                }
            } else if (Array.isArray(value)) {
                // If the value is an array, join its elements into a single string if not empty
                if (value.length > 0) {
                    queryString += encodeURIComponent(fullKey) + '=[' + encodeURIComponent(value.join(',')) + ']&';
                }
            } else if (value !== '' && value !== null) {
                // If the value is a simple type and not empty, add it directly                
                queryString += encodeURIComponent(fullKey) + '=' + encodeURIComponent(value) + '&';
            }
        });

        // Remove the trailing '&' and return the query string
        return queryString.slice(0, -1);
    }



    /* update the current url after a search was triggered */
    window.updateUrl = function (params) {
        console.log("Update params::::");
        console.log(params);
        //function updateUrl(params) {
        window.popstateActive = sessionStorage.getItem('popstate');
        if (window.popstateActive === 'false') {
            window.previousUrls.push(window.location.href);
            sessionStorage.setItem('urls', JSON.stringify(window.previousUrls));
        }

        resetsearchUrl();
        var queryString = customParam(params);
        var currentUrl = window.location.href;
        if (currentUrl.slice(-1) === "/") {
            currentUrl = currentUrl.slice(0, -1);
        }
        history.pushState(null, "Discover", currentUrl + '/?' + queryString);

    }

    /**
     * Check the thumbnail, if not exists then hide it and change the divs
     * @param {type} resourceUrl
     * @returns {undefined}
     */
    window.checkThumbnailImage = function (resourceUrl) {
        //function checkThumbnailImage(resourceUrl) {
        // Create a new Image object
        var imgSrc = 'https://arche-thumbnails.acdh.oeaw.ac.at/' + resourceUrl + '?width=600';
        var img = new Image();
        img.src = imgSrc;
        img.onerror = function () {
            $('[data-thumbnailid="' + resourceUrl + '"]').hide();
            $('[data-contentid="' + resourceUrl + '"]').removeClass('col-lg-10');
            $('[data-contentid="' + resourceUrl + '"]').addClass('col-lg-12');
        };
    }

    window.createPager = function (totalPages) {
        //function createPager(totalPages) {
        var actualPage = (getGuiSearchParams('actualPage') ?? 1);
        $('#smartsearch-pager').empty();
        var startPage = Math.max(actualPage - 2, 1);
        var endPage = Math.min(startPage + 3, totalPages);

        if (actualPage > 1) {
            $('#smartsearch-pager').append('<a href="#" class="paginate_button previous" data-page="' + (actualPage - 1) + '"><</a>');
        }

        $('#smartsearch-pager').append('<span class="search-paging-numbers" >');
        for (var i = startPage; i <= endPage; i++) {
            var current = "";
            if (i === parseInt(actualPage)) {
                current = "current";
            }

            $('#smartsearch-pager').append('<a href="#"  class="paginate_button ' + current + '" data-page="' + i + '">' + i + '</a>');

        }
        if (totalPages > endPage) {
            $('#smartsearch-pager').append('<span>...</span>');
            $('#smartsearch-pager').append('<a href="#"  class="paginate_button" data-page="' + totalPages + '">' + totalPages + '</a>');
        }

        $('#smartsearch-pager').append('</span>');

        // Add "Next" button
        if (actualPage < totalPages) {
            $('#smartsearch-pager').append('<a href="#"  class="paginate_button next" data-page="' + (actualPage + 1) + '">></a>');
        }
    }


  
    /**
     * Get the language
     * @param {type} data
     * @param {type} prefLang
     * @returns {smartsearchL#1.getLangValue.data}
     */
    window.getLangValue = function (data, prefLang) {
        //function getLangValue(data, prefLang) {
        prefLang = prefLang || 'en';
        return data[prefLang] || Object.values(data)[0];
    }


    /**
     * Display warning text on the search page
     * @param {type} message
     * @param {type} cssClass
     * @returns {undefined}
     */
    window.displaySearchWarningMessage = function (message, cssClass) {
        //function displaySearchWarningMessage(message, cssClass) {
        if (typeof message !== 'undefined') {
            $('.main-content-warnings').html('<div class="' + cssClass + ' warning-message-div">' + message + '</div>');
        }
    }

    /**
     * set the colors of the restriction labels
     * @param {type} accessText
     * @returns {String}
     */
    window.setAccessRestrictionLabel = function (accessText) {
        //function setAccessRestrictionLabel(accessText) {

        var wordRegex = /\b(public|restricted|academic)\b/g;
        var matches = [];
        var match;
        while ((match = wordRegex.exec(accessText)) !== null) {
            matches.push(match[0]);
        }
        var matchesCount = matches.length;
        if (matchesCount === 1) {
            return '<p class="btn-toolbar btn-toolbar-' + matches[0] + ' no-btn">';
        } else if (matchesCount === 2) {
            var restrictedText = false;
            var publicText = false;
            var academicText = false;
            var selected = "";
            $.each(matches, function (k, v) {
                if (v === 'public') {
                    if (k === 0) {
                        selected = "public";
                    }
                    publicText = true;
                } else if (v === 'restricted') {
                    if (k === 0) {
                        selected = "restricted";
                    }
                    restrictedText = true;
                } else if (v === 'academic') {
                    if (k === 0) {
                        selected = "academic";
                    }
                    academicText = true;
                }
            });
            if (publicText && restrictedText) {
                if (selected === 'public') {
                    return '<p class="btn-toolbar btn-toolbar-public-restricted no-btn">';
                }
                return '<p class="btn-toolbar btn-toolbar-restricted-public no-btn">';
            } else if (publicText && academicText) {
                if (selected === 'public') {
                    return '<p class="btn-toolbar btn-toolbar-public-academic no-btn">';
                }
                return '<p class="btn-toolbar btn-toolbar-academic-public no-btn">';
            } else if (restrictedText && academicText) {
                if (selected === 'academic') {
                    return '<p class="btn-toolbar btn-toolbar-academic-restricted no-btn">';
                }
                return '<p class="btn-toolbar btn-toolbar-restricted-academic no-btn">';
            }
        }

        return '<p class="btn-toolbar btn-toolbar-public no-btn">';
    }

    window.shorten = function (v) {
        //function shorten(v) {
        for (var i = 0; i < nmsp.length; i++) {
            if (v.startsWith(nmsp[i].prefix)) {
                return nmsp[i].alias + ':' + v.substring(nmsp[i].prefix.length);
            }
        }
        return v;
    }


});