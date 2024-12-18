jQuery(function ($) {

    /********************** EVENTS *************************************/

    $(document).ready(function () {

        $('.main-content-warnings').html("");
        $('#searchInValue').val("");
        $(window).on('popstate', function (e) {
            // Call the function to handle the URL change
            loadPreviousUrl();
        });

        function handleURLChange() {
            var currentUrl = window.location.href;
            // Create a URL object to extract pathname
            var url = new URL(currentUrl);
            // Check if the URL contains any params
            if ((currentUrl.indexOf("/browser/discover?") !== -1 || currentUrl.indexOf("/browser/discover/") !== -1) && (url.search !== "" || url.search.trim() !== "")) {
                window.getSearchParamsFromUrl(currentUrl);
                window.executeTheSearch();
            } else {
                window.executeTheSearch();
            }
        }
        // Call function specific to no popstate event
        handleURLChange();
        window.initializeMaps();
    });

    //// events ////
    /**
     * Check enter is pressed
     */
    $(document).delegate("input", "keypress", function (e) {
        // Check if the Enter key (keyCode 13) is pressed
        if (e.keyCode === 13) {
            window.firstLoad = false;
            // Prevent the default form submission behavior
            e.preventDefault();
            // Trigger a click event on the submit button
            window.executeTheSearch();
        }
    });

    $(document).delegate("select", "keypress", function (e) {
        // Check if the Enter key (keyCode 13) is pressed
        if (e.keyCode === 13) {
            window.firstLoad = false;
            // Prevent the default form submission behavior
            e.preventDefault();
            // Trigger a click event on the submit button
            window.executeTheSearch();
        }
    });

    /**
     * handle the select 2 press enter event and trigger a search
     */
    $(document).on('keyup', '.select2-search__field', function (e) {
        if (e.which === 13) {
            e.preventDefault();
            window.firstLoad = false;
            window.executeTheSearch();
        }
    });


    ////// SEARCH IN Function START /////
    $(document).delegate(".searchInBtn", "click", function (e) {
        var resourceId = $(this).data('resource-id');
        var buttonId = $(this).attr('id');
        $('#searchInValue').val(resourceId);
        if (buttonId === 'removeSearchInElementBtn') { // Check if the id is equal to 'yourId'
            $('#searchIn').empty();
            $('#searchIn').hide();
            $('#searchInValue').val("");
            $('#searchIn').hide();
            //$('.discover-content-main .smart-result-row .searchInBtn').prop('disabled', false);
        } else {
            window.searchInAdd(resourceId, $(this).data('resource-title'));
            $('#searchIn').show();
        }

        window.executeTheSearch();

    });

    ////// SEARCH IN Function END /////

    $(document).delegate(".resetSmartSearch", "click", function (e) {
        window.firstLoad = true;
        e.preventDefault();
        $('#block-smartsearchblock input[type="text"]').val('');
        $('#block-smartsearchblock input[type="search"]').val('');
        $('#block-smartsearchblock input[type="checkbox"]').prop('checked', false);
        $('#block-smartsearchblock textarea').val('');
        $('#block-smartsearchblock select').val('');
        $('#sm-hero-str').val('');
        $('#searchInValue').val("");
        $('#mapSelectedPlace').html('');
        $('#mapLabel').html('');
        // do a topcollection search
        window.resetSearch();
    });

    $(document).delegate("#mapRemoveFiltersBtn", "click", function (e) {
        e.preventDefault();
        var url = window.location.href;
        var paramsString = "";
        if (url.split('/browser/discover?')[1]) {
            paramsString = url.split('/browser/discover?')[1];
        } else {
            paramsString = url.split('/browser/discover/')[1];
        }
        var pattern = /&facets%5Bmap%5D=POLYGON\(\([^)]*\)\)&/;

        // Replace the specific part with a single &
        var newUrl = paramsString.replace(pattern, '&');

        window.guiObj = {};
        // Fix any potential issues with dangling & or multiple & in a row
        newUrl = newUrl.replace(/&&/, '&').replace(/\?&/, '?').replace(/&$/, '');

        // Update the URL without reloading the page
        var newFullUrl = window.location.pathname + newUrl;
        window.trackPageView(newFullUrl);
        window.location.href = newFullUrl;
    });

    //main search block
    $(document).delegate(".smartsearch-btn", "click", function (e) {
        e.preventDefault();
        if ($('.discover-content-main').is(':hidden')) {
            $('.discover-content-main').show();
        }
        window.guiObj = {'actualPage': 1};
        window.firstLoad = false;
        window.executeTheSearch();
    });

    $(document).delegate(".paginate_button", "click", function (e) {
        e.preventDefault();
        window.actualPage = parseInt($(this).text());
        window.guiObj = {'actualPage': window.actualPage};
        window.executeTheSearch();
    });

    $(document).delegate("#smartPageSize", "change", function (e) {
        e.preventDefault();
        window.guiObj = {'actualPage': 1};
        window.executeTheSearch();
    });

    $(document).delegate("#mapToggleBtn", "click", function (e) {
        e.preventDefault();
        $('.sm-map').css('top', $('.sm-map').css('top') == '0px' ? -3000 : 0);
        $('.sm-map').css('position', $('.sm-map').css('position') == 'absolute' ? 'inherit' : 'absolute');

        setTimeout(function () {
            window.map.invalidateSize();  // 'map' is your Leaflet map variable
        }, 100);
    });

    /* SUBMIT THE SMART SEARCH FORM WITH ENTER - NOT WORKING*/
    $('#hero-smart-search-form').on('keydown', 'input', function (event) {
        if (event.which === 13) { // Check if Enter key was pressed (key code 13)
            window.firstLoad = false;
            event.preventDefault();
            window.executeTheSearch();
        }
    });


    /////////////////// EVENTS END /////////////////////

    //////////////// SMART SEARCH ///////////////////

    /**
     * The basic jsut facet display search function
     * @returns {undefined}
     */
    function showJustSearchFacets() {
        window.token++;
        var localToken = window.token;
        var pagerPage = (window.getGuiSearchParams('page') ?? 1) - 1;
        $('.main-content-warnings').html('');
        var param = {
            url: '/browser/api/smartsearch',
            method: 'get',
            data: {
                q: "",
                preferredLang: drupalSettings.arche_core_gui.gui_lang,
                includeBinaries: 0,
                linkNamedEntities: 0,
                page: pagerPage,
                pageSize: $('#smartPageSize').val(),
                facets: {},
                searchIn: [],
                noCache: 0
            }
        };

        var t0 = new Date();
        param.success = function (x) {
            if (window.token === localToken) {
                window.showResults(x, param.data, t0, true);
                updateSearchGui(window.selectedSearchValues);
            }
        };
        param.fail = function (xhr, status, error) {
            if (xhr.status === 404) {
                $('.main-content-row').html('<div class="alert alert-danger" role="alert">' + Drupal.t("Error! Search API has the following error:11 " + error) + '</div>');
            }
            alert(xhr.responseText);
            $('.main-content-row').html('<div class="alert alert-danger" role="alert">' + Drupal.t("Error! Search API has the following error:22 " + error) + '</div>');
        };

        param.error = function (xhr, status, error) {
            if (error === 'timeout') {
                $('.main-content-row').html('<div class="alert alert-danger" role="alert">' + Drupal.t("Timeout error, please refine your Query!") + '</div>');
            } else {
                $('.main-content-row').html('<div class="alert alert-danger" role="alert">' + Drupal.t("Error! Search API has the following error:33 " + xhr.responseText) + '</div>');
            }
        };
        param.timeout = drupalSettings.arche_core_gui.smartsearch_timeout;
        $.ajax(param);
    }

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

    window.buildParams = function (searchStr, pagerPage, apiUrl = '/browser/api/smartsearch') {
        var page = 0;
        if (window.actualPage !== 0) {
            page = window.actualPage - 1;
        }

        var param = {
            url: apiUrl,
            method: 'get',
            data: {
                q: searchStr,
                preferredLang: drupalSettings.arche_core_gui.gui_lang,
                includeBinaries: $('#inBinary').is(':checked') ? 1 : 0,
                linkNamedEntities: $('#linkNamedEntities').is(':checked') ? 1 : 0,
                page: page,
                pageSize: $('#smartPageSize').val(),
                facets: {},
                searchIn: [],
                noCache: 0
                        //noCache: $('#noCache').is(':checked') ? 1 : 0
            }
        };

        //if we have already selected facets from the url then we have to update 
        // the facets
        if (window.getGuiSearchParams('facets')) {
            param.data.facets = window.getGuiSearchParams('facets');
        }

        $(".smart-search-multi-select").each(function () {
            var prop = $(this).attr('data-property');
            var val = $(this).val();
            if (!(prop in param.data.facets)) {
                param.data.facets[prop] = [];
            }
            param.data.facets[prop] = val;
        });

        $('input.facet-min').each(function (n, facet) {
            var prop = $(facet).attr('data-value');
            var val = $(facet).val();
            if (val !== "") {
                if (!(prop in param.data.facets)) {
                    param.data.facets[prop] = {};
                }
                param.data.facets[prop].min = val;
            }
        });

        $('input.facet-max').each(function (n, facet) {
            var prop = $(facet).attr('data-value');
            var val = $(facet).val();
            if (val !== "") {
                if (!(prop in param.data.facets)) {
                    param.data.facets[prop] = {};
                }
                param.data.facets[prop].max = val;
            }
        });

        $('input.range:checked').each(function (n, facet) {
            var prop = $(facet).attr('data-value');
            if (!(prop in param.data.facets)) {
                param.data.facets[prop] = {};
            }
            param.data.facets[prop].distribution = 1;
        });

        $('input.distribution:checked').each(function (n, facet) {
            var prop = $(facet).attr('data-value');
            if (!(prop in param.data.facets)) {
                param.data.facets[prop] = {};
            }
            param.data.facets[prop].distribution = (param.data.facets[prop].distribution || 0) + 2;
        });

        /*
         if ($('#searchInChb:checked').length === 1) {
         $('#searchIn > div').each(function (n, el) {
         param.data.searchIn.push($(el).attr('data-value'));
         });
         }*/

        if (window.getGuiSearchParams('searchIn')) {
            param.data.searchIn.push(window.getGuiSearchParams('searchIn'));
        }

        if (window.bboxObj.drawnItems) {
            if (window.bboxObj.drawnItems.getLayers().length > 0) {
                var coord = window.bboxObj.drawnItems.getLayers()[0].toGeoJSON().geometry.coordinates[0];
                param.data.facets['map'] = 'POLYGON((' + coord.map((x) => x[0] + ' ' + x[1]).join(',') + '))';
            }
        }
        return param;
    }

    /**
     * Perform the main search function
     * @returns {undefined}
     */
    function search() {
        window.token++;
        $('.main-content-warnings').html('');
        var localToken = window.token;

        if (window.popstateActive === 'true') {
            window.firstLoad = false;
        }

        if (window.firstLoad) {
            return showJustSearchFacets();
        }


        var searchStr = $('#sm-hero-str').val();
        var pagerPage = (window.getGuiSearchParams('page') ?? 1) - 1;
        if (pagerPage === -1) {
            pagerPage = 0;
        }

        //var guiFacets_ = (getGuiSearchParams('facets')) ? getGuiSearchParams('facets') : {};

        if (searchStr === "") {
            searchStr = (window.getGuiSearchParams('q')) ? window.getGuiSearchParams('q') : "";
        }
        updateSearchStrInput(searchStr);

        var param = window.buildParams(searchStr, pagerPage);
        var t0 = new Date();
        param.success = function (x) {
            if (window.token === localToken) {
                //console.log("search ajax success - param.data: ");
                //console.log(param.data);
                window.showResults(x, param.data, t0);
            }
        };

        param.fail = function (xhr, textStatus, errorThrown) {
            alert(xhr.responseText);
            $('.main-content-row').html('<div class="alert alert-danger" role="alert">' + Drupal.t("Error! Search API has the following error: 44" + error) + '</div>');
        };

        param.error = function (xhr, status, error) {
            if (error === 'timeout') {
                $('.main-content-row').html('<div class="alert alert-danger" role="alert">' + Drupal.t("Timeout error, please refine your Query!") + '</div>');
                $(".discover-left input, .discover-left textarea, .discover-left select, .discover-left button").prop("disabled", false);
            } else {
                $('.main-content-row').html('<div class="alert alert-danger" role="alert">' + Drupal.t("Error! Search API has the following error:55 " + xhr.responseText) + '</div>');
                $(".discover-left input, .discover-left textarea, .discover-left select, .discover-left button").prop("disabled", false);
            }
        };
        sessionStorage.setItem('popstate', false);
        param.timeout = drupalSettings.arche_core_gui.smartsearch_timeout;
        $.ajax(param);
    }

    /**
     * Load the latest url after the user clicked the back button on the browser
     * @returns {undefined}
     */
    function loadPreviousUrl() {
        sessionStorage.setItem('popstate', true);
        if (window.previousUrls.length > 0) {
            // Get the previous URL
            var previousUrl = window.previousUrls[window.previousUrls.length - 1];
            // Update sessionStorage
            // Remove the current URL
            window.previousUrls.pop();
            sessionStorage.setItem('urls', JSON.stringify(window.previousUrls));
            // Navigate to the previous URL
            let newFullUrl = window.location.href;
            window.trackPageView(newFullUrl);
            window.location.href = previousUrl;
        }
    }

    window.executeTheSearch = function () {
        $('.arche-smartsearch-page-div').show();
        $('.main-content-row').html('<div class="container">' +
                '<div class="row">' +
                '<div class="col-12 mt-5">' +
                '<img class="mx-auto d-block" src="/browser/modules/contrib/arche_core_gui/images/arche_logo_flip_47px.gif">' +
                ' </div>' +
                '</div>');
        $(".discover-left input, .discover-left textarea, .discover-left select, .discover-left button").prop("disabled", true);
        search();
    }

    function updateSearchGui(data) {
        $.each(data, function (k, v) {
            var elementId = "";
            var dataValue = "";
            var elementValue = "";
            $.each(v, function (key, val) {

                if (key === "id") {
                    elementId = "#" + val;
                }

                if (key === "value") {
                    elementValue = val;
                }

                if (key === "data") {
                    dataValue = val;
                }
            });
            if (elementId) {
                $('#block-smartsearchblock')
                        .find('[id="' + elementId + '"][value="' + elementValue + '"]')
                        .each(function () {
                            $(this).addClass("selected");
                        });
            }
            if (dataValue) {
                $('#block-smartsearchblock')
                        .find('[data-value="' + dataValue + '"][value="' + elementValue + '"]')
                        .each(function () {
                            $(this).prop("checked", true);
                        });
            }
        });
    }

    window.searchInAdd = function (id, title) {
        if ($('#in' + id).length === 1) {
            return;
        }
        var element = $('#res' + id).clone();
        var btn = element.find('button');
        btn.text('-');
        btn.attr('id', 'removeSearchInElementBtn');
        element.attr('id', 'in' + id);
        $('#searchIn').append(element);

        // !!!! EXTEND! if the url is copied to a new browser, then we have to
        // fetch the resource base data by id

    }

});
