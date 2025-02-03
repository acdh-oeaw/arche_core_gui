jQuery(function ($) {

    window.apiUrl = '/browser/api/smartsearch';
    window.token = 1;
    window.searchIn = [];
    window.preferredLang = drupalSettings.arche_core_gui.gui_lang;
    window.archeBaseUrl = getInstanceUrl();
    window.actualPage = 1;
    window.map = null;
    window.searchArea = null;
    var nmsp = [
        {prefix: 'https://vocabs.acdh.oeaw.ac.at/schema#', alias: 'acdh'},
        {prefix: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#', alias: 'rdf'}
    ];

    function getInstanceUrl() {
        var baseUrl = window.location.origin + window.location.pathname;
        return baseUrl.split("/browser")[0];
    }

    /* reset search button clicked */
    window.resetSearch = function () {
        window.search('', '');
    }

    // Function to track dynamic pageviews
    window.trackPageView = function (newUrl) {
        window._paq.push(['setCustomUrl', newUrl]);
        window._paq.push(['setDocumentTitle', document.title]);
        window._paq.push(['trackPageView']);
    }

    window.createPager = function (totalPages, actualPage) {
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
