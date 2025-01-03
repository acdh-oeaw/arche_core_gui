jQuery(function ($) {

    /********************** EVENTS *************************************/

    $(document).ready(function () {

        $('.main-content-warnings').html("");
        $('#searchInValue').val("");
        window.initializeMaps();

        $(window).on('popstate', function (e) {
            if (event.state !== undefined) {
                window.search('none', event.state);
            }
        });
        var paramUrl = (new URL(window.location.href)).search.substring(1);
        window.search('replace', paramUrl);
    });

    //// events ////
    /**
     * Check enter is pressed
     */
    $(document).delegate("input", "keypress", function (e) {
        // Check if the Enter key (keyCode 13) is pressed
        if (e.keyCode === 13) {
            e.preventDefault();
            window.search();
        }
    });

    $(document).delegate("select", "keypress", function (e) {
        // Check if the Enter key (keyCode 13) is pressed
        if (e.keyCode === 13) {
            e.preventDefault();
            window.search();
        }
    });

    /**
     * handle the select 2 press enter event and trigger a search
     */
    $(document).on('keyup', '.select2-search__field', function (e) {
        if (e.which === 13) {
            e.preventDefault();
            window.search();
        }
    });


    ////// SEARCH IN Function START /////
    $(document).delegate(".searchInBtn", "click", function (e) {
        var id = $(this).data('resource-id');
        if (id === 'removeSearchInElementBtn') {
            $('#searchIn').hide();
            window.searchIn = [];
        } else {
            window.searchIn = [id];
        }
        window.search();
    });

    ////// SEARCH IN Function END /////

    $(document).delegate(".resetSmartSearch", "click", function (e) {
        e.preventDefault();
        window.resetSearch();
    });

    $(document).delegate("#mapRemoveFiltersBtn", "click", function (e) {
        e.preventDefault();
        window.mapRemoveSearchArea();
        window.search();
    });

    //main search block
    $(document).delegate(".smartsearch-btn", "click", function (e) {
        e.preventDefault();
        if ($('.discover-content-main').is(':hidden')) {
            $('.discover-content-main').show();
        }
        window.search();
    });

    $(document).delegate(".paginate_button", "click", function (e) {
        e.preventDefault();
        window.actualPage = parseInt($(this).text());
        window.search();
    });

    $(document).delegate("#smartPageSize", "change", function (e) {
        e.preventDefault();
        window.actualPage = 1;
        window.search();
    });

    $(document).delegate("#mapToggleBtn", "click", function() {window.mapToggle();});
    /* SUBMIT THE SMART SEARCH FORM WITH ENTER - NOT WORKING*/
    $('#hero-smart-search-form').on('keydown', 'input', function (event) {
        if (event.which === 13) { // Check if Enter key was pressed (key code 13)
            event.preventDefault();
            window.search();
        }
    });

    /////////////////// EVENTS END /////////////////////

    //////////////// SMART SEARCH ///////////////////

    /**
     * if the search is executed by the hero section, we have to update the input field
     * @param {type} str
     * @returns {undefined}
     */
    function updateSearchStrInput(str) {
        if ($('#sm-hero-str').val() === "") {
            $('#sm-hero-str').val(str);
        }
    }

    window.getSearchParamBase = function() {
        return {
            q: '',
            preferredLang: drupalSettings.arche_core_gui.gui_lang,
            includeBinaries: 0,
            linkNamedEntities: 1,
            page: Math.max(0, window.actualPage !== 0 ? window.actualPage - 1 : 0),
            pageSize: $('#smartPageSize').val(),
            facets: {},
            searchIn: [],
            noCache: 0
        }
    }

    function collectBackendQueryParam() {
        var param = window.getSearchParamBase();

        param.q = $('#sm-hero-str').val();
        param.searchIn = window.searchIn;
        param.includeBinaries = $('#inBinary').is(':checked') ? 1 : 0;
        param.linkNamedEntities = $('#linkNamedEntities').is(':checked') ? 1 : 0;

        $(".smart-search-multi-select").each(function () {
            var prop = $(this).attr('data-property');
            var val = $(this).val();
            if (!(prop in param.facets)) {
                param.facets[prop] = [];
            }
            param.facets[prop] = val;
        });

        $('input.facet-min').each(function (n, facet) {
            var prop = $(facet).attr('data-value');
            var val = $(facet).val();
            if (val !== "") {
                if (!(prop in param.facets)) {
                    param.facets[prop] = {};
                }
                param.facets[prop].min = val;
            }
        });

        $('input.facet-max').each(function (n, facet) {
            var prop = $(facet).attr('data-value');
            var val = $(facet).val();
            if (val !== "") {
                if (!(prop in param.facets)) {
                    param.facets[prop] = {};
                }
                param.facets[prop].max = val;
            }
        });

        $('input.range:checked').each(function (n, facet) {
            var prop = $(facet).attr('data-value');
            if (!(prop in param.facets)) {
                param.facets[prop] = {};
            }
            param.facets[prop].distribution = 1;
        });

        $('input.distribution:checked').each(function (n, facet) {
            var prop = $(facet).attr('data-value');
            if (!(prop in param.facets)) {
                param.facets[prop] = {};
            }
            param.facets[prop].distribution = (param.facets[prop].distribution || 0) + 2;
        });

        var bbox = window.searchArea.getBounds();
        if (bbox._northEast) {
            var W = bbox.getWest().toPrecision(5);
            var S = bbox.getSouth().toPrecision(5);
            var E = bbox.getEast().toPrecision(5);
            var N = bbox.getNorth().toPrecision(5);
            param.facets['map'] = 'POLYGON((' + W + ' ' + S + ',' + W + ' ' + N + ',' + E + ' ' + N + ',' + E + ' ' + S + ',' + W + ' ' + S + '))';
        }

        return param;
    }

    /**
     * Perform the main search function
     * @returns {undefined}
     */
    window.search = function(historyAction, paramUrl) {
        $('.arche-smartsearch-page-div').show();
        $('.main-content-row').html('<div class="container">' +
                '<div class="row">' +
                '<div class="col-12 mt-5">' +
                '<img class="mx-auto d-block" src="/browser/modules/contrib/arche_core_gui/images/arche_logo_flip_47px.gif">' +
                ' </div>' +
                '</div>');
        $(".discover-left input, .discover-left textarea, .discover-left select, .discover-left button").prop("disabled", true);
        $('.main-content-warnings').html('');

        window.token++;
        var localToken = window.token;
        var data = paramUrl || paramUrl === '' ? window.parseQueryString(paramUrl) : collectBackendQueryParam(); // empty paramUrl is used to reset the search
        var t0 = new Date();
        var param = {
            url: window.apiUrl,
            method: 'get',
            data: data,
            timeout: drupalSettings.arche_core_gui.smartsearch_timeout,
            success: function (x) {
                if (window.token === localToken) {
                    //console.log("search ajax success - data: ");
                    //console.log(data);
                    window.showResults(x, data, t0);
                }
            },
            fail: function (xhr, textStatus, errorThrown) {
                alert(xhr.responseText);
                $('.main-content-row').html('<div class="alert alert-danger" role="alert">' + Drupal.t("Error! Search API has the following error: 44" + error) + '</div>');
            },
            error: function (xhr, status, error) {
                if (error === 'timeout') {
                    $('.main-content-row').html('<div class="alert alert-danger" role="alert">' + Drupal.t("Timeout error, please refine your Query!") + '</div>');
                    $(".discover-left input, .discover-left textarea, .discover-left select, .discover-left button").prop("disabled", false);
                } else {
                    $('.main-content-row').html('<div class="alert alert-danger" role="alert">' + Drupal.t("Error! Search API has the following error:55 " + xhr.responseText) + '</div>');
                    $(".discover-left input, .discover-left textarea, .discover-left select, .discover-left button").prop("disabled", false);
                }
            }
        };
        // convert backend search parameters to an URL part
        var newParamUrl = $.param(data);
        // generate the URL for the current search
        // by taking the current URL and replacing its search part
        // with the current search parameters
        var newUrl = new URL(window.location.href);
        newUrl.search = newParamUrl;
        newUrl = newUrl.toString();
        // push the current search on top of the browsing history stack
        if (historyAction === 'replace') {
            // used on page load
            history.replaceState(newParamUrl, null, newUrl);
        } else if (historyAction !== 'none') {
            // used on all other searches but the one triggered by the history back
            history.pushState(newParamUrl, null, newUrl);
        }
        $.ajax(param);
    }
});
