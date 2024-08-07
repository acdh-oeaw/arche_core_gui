jQuery(function ($) {



    var selectedSearchValues = [];
    var firstLoad = true;
    var token = 1;
    var previousUrls = JSON.parse(sessionStorage.getItem('urls')) || [];
    var popstateActive = sessionStorage.getItem('popstate') || false;
    var bbox = null;
    var map = null;
    var mapPins = null;
    var preferredLang = drupalSettings.arche_core_gui.gui_lang;
    var archeBaseUrl = getInstanceUrl();
    var actualPage = 1;
    var guiObj = {};
    var bboxObj = {};
    var smartSearchInputField = $('#sm-hero-str');
    var autocompleteTimeout = null;
    var autocompleteCounter = 1;


    /********************** EVENTS *************************************/

    $(document).ready(function () {

        $('.main-content-warnings').html("");

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
                getSearchParamsFromUrl(currentUrl);
                executeTheSearch();
            } else {
                executeTheSearch();
            }
        }
        // Call function specific to no popstate event
        handleURLChange();
        initMaps();
    });

    //// events ////
    /**
     * Check enter is pressed
     */
    $(document).delegate("input", "keypress", function (e) {
        // Check if the Enter key (keyCode 13) is pressed
        if (e.keyCode === 13) {
            firstLoad = false;
            // Prevent the default form submission behavior
            e.preventDefault();
            // Trigger a click event on the submit button
            executeTheSearch();
        }
    });

    $(document).delegate("select", "keypress", function (e) {
        // Check if the Enter key (keyCode 13) is pressed
        if (e.keyCode === 13) {
            firstLoad = false;
            // Prevent the default form submission behavior
            e.preventDefault();
            // Trigger a click event on the submit button
            executeTheSearch();
        }
    });

    /**
     * handle the select 2 press enter event and trigger a search
     */
    $(document).on('keyup', '.select2-search__field', function (e) {
        if (e.which === 13) {
            e.preventDefault();
            firstLoad = false;
            executeTheSearch();
        }
    });

    smartSearchInputField.autocomplete({
        minLength: 2, // Minimum number of characters to trigger autocomplete
        autoFocus: false,
        delay: 300,
        open: function () {
            $("ul.ui-menu").width($(this).innerWidth());
        }
    });

    // Attach keyup event listener to the input field
    smartSearchInputField.on('keyup', function () {
        if (event.keyCode !== 37 && // Left arrow
                event.keyCode !== 38 && // Up arrow
                event.keyCode !== 39 && // Right arrow
                event.keyCode !== 40    // Down arrow
                ) {
            // Get the current value of the input field
            var inputValue = $(this).val();

            // Check if the input value is at least 2 characters long
            if (inputValue.length >= 2) {
                if (autocompleteTimeout) {
                    // invalidate the previous autocomplete search
                    clearTimeout(autocompleteTimeout);
                }
                // make the AJAX query only if no further keyup events in next 0.3s
                autocompleteTimeout = setTimeout(() => {
                    autocompleteCounter++;
                    var localCounter = autocompleteCounter;
                    // Make an AJAX request to your API
                    $.ajax({
                        url: '/browser/api/smsearch/autocomplete/' + inputValue,
                        method: 'GET',
                        success: function (data) {
                            // show this results only if no further searches were made in the meantime
                            if (localCounter === autocompleteCounter) {
                                var responseObject = $.parseJSON(data);
                                // Initialize autocomplete with the retrieved results
                                smartSearchInputField.autocomplete({source: []});
                                smartSearchInputField.autocomplete({
                                    source: responseObject
                                });
                                // Open the autocomplete dropdown
                                smartSearchInputField.autocomplete('search');
                            }
                        },
                        error: function (xhr, status, error) {
                            console.error('Error fetching autocomplete data:', error);
                        }
                    });
                }, 300);
            }
        }
    });

    ////// SEARCH IN Function START /////
    $(document).delegate(".searchInBtn", "click", function (e) {
        var buttonId = $(this).attr('id'); // Get the id attribute value of the clicked button
        if (buttonId === 'removeSearchInElementBtn') { // Check if the id is equal to 'yourId'
            $('#searchIn').empty();
            $('#searchIn').hide();
            $('.discover-content-main .smart-result-row .searchInBtn').prop('disabled', false);
        } else {
            searchInAdd($(this).data('resource-id'), $(this).data('resource-title'));
            $('#searchIn').show();
            $('.discover-content-main').hide();
            var count = $('#searchIn').length;
            if (count > 0) {
                $('.discover-content-main .smart-result-row .searchInBtn').prop('disabled', true);
            }
        }
    });

    $(document).delegate(".remove_search_only_in", "click", function (e) {
        e.preventDefault();
        var id = $(this).attr("data-removeid");
        // #in17722
        $('#searchIn #in' + id).remove();
        countSearchIn();
    });

    $(document).delegate(".smartSearchInAdd", "click", function (e) {
        e.preventDefault();
        var id = $(this).attr("data-resourceid");
        if ($('#in' + id).length === 1) {
            return;
        }

        var element = $('#res' + id).clone();
        element.find('div:first-child').html('<a data-removeid="' + id + '" href="#" class="remove_search_only_in">Remove</a>');
        //element.find('div:last-child').children('div').remove();
        var btn = element.find('button');
        btn.text('-');
        btn.attr('id', 'removeSearchInElementBtn');
        element.attr('id', 'in' + id);
        element.attr('class', 'searchInElement');
        element.addClass('row');
        $('#searchIn').append(element);

    });

    ////// SEARCH IN Function END /////

    $(document).delegate(".resetSmartSearch", "click", function (e) {
        firstLoad = true;
        e.preventDefault();
        $('#block-smartsearchblock input[type="text"]').val('');
        $('#block-smartsearchblock input[type="search"]').val('');
        $('#block-smartsearchblock input[type="checkbox"]').prop('checked', false);
        $('#block-smartsearchblock textarea').val('');
        $('#block-smartsearchblock select').val('');
        $('#sm-hero-str').val('');
        $('#mapSelectedPlace').html('');
        $('#mapLabel').html('');
        // do a topcollection search
        resetSearch();
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

        guiObj = {};
        // Fix any potential issues with dangling & or multiple & in a row
        newUrl = newUrl.replace(/&&/, '&').replace(/\?&/, '?').replace(/&$/, '');

        // Update the URL without reloading the page
        var newFullUrl = window.location.pathname + newUrl;
        window.location.href = newFullUrl;
    });

    //main search block
    $(document).delegate(".smartsearch-btn", "click", function (e) {
        e.preventDefault();
        if ($('.discover-content-main').is(':hidden')) {
            $('.discover-content-main').show();
        }
        guiObj = {'actualPage': 1};
        firstLoad = false;
        executeTheSearch();
    });

    $(document).delegate(".paginate_button", "click", function (e) {
        actualPage = parseInt($(this).text());
        guiObj = {'actualPage': actualPage};
        executeTheSearch()
        e.preventDefault();
    });

    $(document).delegate("#smartPageSize", "change", function (e) {
        guiObj = {'actualPage': 1};
        executeTheSearch();
        e.preventDefault();
    });

    $(document).delegate("#mapToggleBtn", "click", function (e) {
        e.preventDefault();
        $('.sm-map').css('top', $('.sm-map').css('top') == '0px' ? -2000 : 0);
        $('.sm-map').css('position', $('.sm-map').css('position') == 'absolute' ? 'inherit' : 'absolute');

        setTimeout(function () {
            map.invalidateSize();  // 'map' is your Leaflet map variable
        }, 100);
    });

    /* SUBMIT THE SMART SEARCH FORM WITH ENTER - NOT WORKING*/
    $('#hero-smart-search-form').on('keydown', 'input', function (event) {
        if (event.which === 13) { // Check if Enter key was pressed (key code 13)
            firstLoad = false;
            event.preventDefault();
            executeTheSearch();
        }
    });


    /////////////////// EVENTS END /////////////////////


    ////// FUNCTIONS //////

    function initMaps(reinit = false) {

        map = L.map('map').setView([48.2, 16.3], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // FeatureGroup is to store editable layers
        var drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        // Initialize the draw control and pass it the FeatureGroup of editable layers
        var drawControl = new L.Control.Draw({
            draw: {
                position: 'topleft',
                rectangle: {
                    shapeOptions: {
                        color: '#97009c'
                    }
                },
                polygon: false,
                polyline: false,
                circle: false,
                marker: false,
                circlemarker: false
            },
            edit: {
                edit: false,
                featureGroup: drawnItems
            }
        });
        map.addControl(drawControl);

        if (!reinit) {
            var coordinates = (guiObj.facets !== undefined && guiObj.facets.map !== undefined) ? guiObj.facets.map : "";
            if (coordinates) {
                var coordinatesString = coordinates.replace('POLYGON((', '').replace('))', '');
                var coordinatesArray = coordinatesString.split(',');

                // Reformat the coordinates to [latitude, longitude] for Leaflet
                var polygonCoordinates = coordinatesArray.map(function (coord) {
                    var latLng = coord.trim().split(' ');
                    return [parseFloat(latLng[1]), parseFloat(latLng[0])];
                });

                var latitudes = polygonCoordinates.map(function (coord) {
                    return coord[0];
                });
                var longitudes = polygonCoordinates.map(function (coord) {
                    return coord[1];
                });

                var southWest = [Math.min.apply(null, latitudes), Math.min.apply(null, longitudes)];
                var northEast = [Math.max.apply(null, latitudes), Math.max.apply(null, longitudes)];

                var bounds = [southWest, northEast];

                // Create a rectangle layer
                var rectangle = L.rectangle(bounds, {
                    fillColor: '#97009c'
                });

                //map.addLayer(drawnItems);
                drawnItems.addLayer(rectangle);
                drawnItems.addTo(map);

                setTimeout(function () {
                    setMapLabel(drawnItems);
                }, 1000);

                map.fitBounds(rectangle.getBounds());
            }
        }

        map.on(L.Draw.Event.CREATED, function (event) {
            drawnItems.clearLayers();
            bboxObj = {};
            var layer = event.layer;
            map.removeLayer(layer);
            drawnItems.addLayer(layer);

            bboxObj = {drawnItems};
            setMapLabel(drawnItems);
        });

        map.on('draw:drawstart', function (event) {
            var layer = event.layer;
            map.removeLayer(layer);
            drawnItems.clearLayers();
        });

        map.on('draw:deleted', function (event) {
            var layer = event.layer;
            map.removeLayer(layer);
            $('#mapLabel').html('');
            $('.sm-map').css('top', '-1000px');
            $('.sm-map').css('display', 'block');
        });

        bbox = drawnItems;

        var customControl = L.Control.extend({
            options: {
                position: 'topright' // Position the button in the top right corner
            },
            onAdd: function (map) {
                var container = L.DomUtil.create('button', 'leaflet-bar');
                container.innerHTML = 'Close'; // Text of the button
                container.style.backgroundColor = 'white';
                container.style.width = '60px';
                container.style.height = '30px';
                container.style.fontWeight = 'bold';
                container.style.cursor = 'pointer';
                container.style.border = 'none';
                container.style.outline = 'none';

                // Prevent the map from handling the click
                L.DomEvent.disableClickPropagation(container);

                // Setup the click event on the button
                L.DomEvent.on(container, 'click', function () {
                    $('.sm-map').css('top', $('.sm-map').css('top') == '0px' ? -2000 : 0);
                    $('.sm-map').css('position', $('.sm-map').css('position') == 'absolute' ? 'inherit' : 'absolute');

                    setTimeout(function () {
                        map.invalidateSize();  // 'map' is your Leaflet map variable
                    }, 100);
                });

                return container;
            }
        });

        // Add the new control to the map
        map.addControl(new customControl());
    }

    function setMapLabel(bbox) {
        var coord = bbox.getLayers()[0].toGeoJSON().geometry.coordinates[0];
        $('#mapLabel').html('<div class="mapLabelDiv"><a href="#" id="mapRemoveFiltersBtn">X</a> ' + coord[0][0].toPrecision(3) + ', ' + coord[0][1].toPrecision(3) + ' - ' + coord[2][0].toPrecision(3) + ', ' + coord[2][1].toPrecision(3) + '</div>');
    }

    function getSearchParamsFromUrl(url) {
        var paramString = "";
        if (url.split('/browser/discover?')[1]) {
            paramsString = url.split('/browser/discover?')[1];
        } else {
            paramsString = url.split('/browser/discover/')[1];
        }

        paramsString = paramsString.replace('?q', 'q');

        guiObj = {};
        guiObj = parseQueryString(paramsString);

        firstLoad = false;

    }

    /**
     * This function converts back the query string from the url into an object to the smartsearch api
     * -- if we copy pasted the result url
     * @param {type} queryString
     * @returns {unresolved}
     */
    function parseQueryString(queryString) {
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

    function getInstanceUrl() {
        var baseUrl = window.location.origin + window.location.pathname;
        return baseUrl.split("/browser")[0];
    }


    //////////////// SMART SEARCH ///////////////////

    var nmsp = [
        {prefix: 'https://vocabs.acdh.oeaw.ac.at/schema#', alias: 'acdh'},
        {prefix: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#', alias: 'rdf'}
    ];

    function shorten(v) {
        for (var i = 0; i < nmsp.length; i++) {
            if (v.startsWith(nmsp[i].prefix)) {
                return nmsp[i].alias + ':' + v.substring(nmsp[i].prefix.length);
            }
        }
        return v;
    }

    /**
     * Get the search param values from the guiObj
     * @param {type} prop
     * @returns {smartsearchL#1.guiObj|Array}
     */
    function getGuiSearchParams(prop) {
        if (guiObj.hasOwnProperty(prop)) {
            return guiObj[prop];
        }
    }
    /**
     * Get the language
     * @param {type} data
     * @param {type} prefLang
     * @returns {smartsearchL#1.getLangValue.data}
     */
    function getLangValue(data, prefLang) {
        prefLang = prefLang || 'en';
        return data[prefLang] || Object.values(data)[0];
    }

    /**
     * The basic jsut facet display search function
     * @returns {undefined}
     */
    function showJustSearchFacets() {
        token++;
        var localToken = token;
        var pagerPage = (getGuiSearchParams('actualPage') ?? 1) - 1;
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
            if (token === localToken) {
                showResults(x, param.data, t0, true);
                updateSearchGui(selectedSearchValues);
            }
        };
        param.fail = function (xhr, status, error) {
            if (xhr.status === 404) {
                $('.main-content-row').html('<div class="alert alert-danger" role="alert">' + Drupal.t("Error! Search API has the following error: " + error) + '</div>');
            }
            alert(xhr.responseText);
            $('.main-content-row').html('<div class="alert alert-danger" role="alert">' + Drupal.t("Error! Search API has the following error: " + error) + '</div>');
        };
        /*
         param.statusCode = function (response) {
         console.log("statusCode");
         console.log(response);
         };
         */
        param.error = function (xhr, status, error) {
            console.log(xhr);
            console.log(status);
            console.log(error);
            if (error === 'timeout') {
                $('.main-content-row').html('<div class="alert alert-danger" role="alert">' + Drupal.t("Timeout error, please refine your Query!") + '</div>');
            } else {
                $('.main-content-row').html('<div class="alert alert-danger" role="alert">' + Drupal.t("Error! Search API has the following error: " + xhr.responseText) + '</div>');
            }
        };
        param.timeout = 60000;
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

    /**
     * Perform the main search function
     * @returns {undefined}
     */
    function search() {
        token++;
        $('.main-content-warnings').html('');
        var localToken = token;

        if (popstateActive === 'true') {
            firstLoad = false;
        }

        if (firstLoad) {
            return showJustSearchFacets();
        }

        var searchStr = $('#sm-hero-str').val();
        var pagerPage = (getGuiSearchParams('actualPage') ?? 1) - 1;
        //var guiFacets_ = (getGuiSearchParams('facets')) ? getGuiSearchParams('facets') : {};

        if (searchStr === "") {
            searchStr = (getGuiSearchParams('q')) ? getGuiSearchParams('q') : "";
        }

        updateSearchStrInput(searchStr);

        var param = {
            url: '/browser/api/smartsearch',
            method: 'get',
            data: {
                q: searchStr,
                preferredLang: drupalSettings.arche_core_gui.gui_lang,
                includeBinaries: $('#inBinary').is(':checked') ? 1 : 0,
                linkNamedEntities: $('#linkNamedEntities').is(':checked') ? 1 : 0,
                page: pagerPage,
                pageSize: $('#smartPageSize').val(),
                facets: {},
                searchIn: [],
                noCache: 0
                        //noCache: $('#noCache').is(':checked') ? 1 : 0
            }
        };
        //if we have already selected facets from the url then we have to update 
        // the facets
        if (getGuiSearchParams('facets')) {
            param.data.facets = getGuiSearchParams('facets');
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

        if ($('#searchInChb:checked').length === 1) {
            $('#searchIn > div').each(function (n, el) {
                param.data.searchIn.push($(el).attr('data-value'));
            });
        }

        if (bboxObj.drawnItems) {
            if (bboxObj.drawnItems.getLayers().length > 0) {
                var coord = bboxObj.drawnItems.getLayers()[0].toGeoJSON().geometry.coordinates[0];
                param.data.facets['map'] = 'POLYGON((' + coord.map((x) => x[0] + ' ' + x[1]).join(',') + '))';
            }
        }

        //updateUrl(param.data);
        var t0 = new Date();
        param.success = function (x) {
            if (token === localToken) {
                console.log("search ajax success - param.data: ");
                console.log(param.data);
                showResults(x, param.data, t0);
            }
        };

        param.fail = function (xhr, textStatus, errorThrown) {
            alert(xhr.responseText);
            $('.main-content-row').html('<div class="alert alert-danger" role="alert">' + Drupal.t("Error! Search API has the following error: " + error) + '</div>');

        };

        param.error = function (xhr, status, error) {
            console.log(xhr);
            console.log(status);
            console.log(error);
            if (error === 'timeout') {
                $('.main-content-row').html('<div class="alert alert-danger" role="alert">' + Drupal.t("Timeout error, please refine your Query!") + '</div>');
                $(".discover-left input, .discover-left textarea, .discover-left select, .discover-left button").prop("disabled", false);
            } else {
                $('.main-content-row').html('<div class="alert alert-danger" role="alert">' + Drupal.t("Error! Search API has the following error: " + xhr.responseText) + '</div>');
                $(".discover-left input, .discover-left textarea, .discover-left select, .discover-left button").prop("disabled", false);
            }
        };
        sessionStorage.setItem('popstate', false);
        param.timeout = 60000;
        $.ajax(param);
    }

    /* update the current url after a search was triggered */
    function updateUrl(params) {
        popstateActive = sessionStorage.getItem('popstate');
        if (popstateActive === 'false') {
            previousUrls.push(window.location.href);
            sessionStorage.setItem('urls', JSON.stringify(previousUrls));
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

    /**
     * Load the latest url after the user clicked the back button on the browser
     * @returns {undefined}
     */
    function loadPreviousUrl() {
        sessionStorage.setItem('popstate', true);
        if (previousUrls.length > 0) {
            // Get the previous URL
            var previousUrl = previousUrls[previousUrls.length - 1];
            // Update sessionStorage
            // Remove the current URL
            previousUrls.pop();
            sessionStorage.setItem('urls', JSON.stringify(previousUrls));
            // Navigate to the previous URL
            window.location.href = previousUrl;
        }
    }

    /* reset the searchUrl and remove the params */
    function resetsearchUrl() {
        var currentUrl = window.location.href;
        var discoverIndex = currentUrl.indexOf('/discover/');
        if (discoverIndex !== -1) {
            currentUrl = currentUrl.substring(0, discoverIndex + '/discover/'.length);
        }
        history.pushState(null, "Discover", currentUrl);
    }


    /* reset search button clicked */
    function resetSearch() {
        guiObj = {};
        guiObj = {'actualPage': 1};
        resetsearchUrl();
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

    function createPager(totalPages) {
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
     * Display the smartsearch results
     * @param {type} data
     * @param {type} param
     * @param {type} t0
     * @param {type} initial
     * @returns {undefined}
     */
    function showResults(data, param, t0, initial = false) {
        console.log("SHOW RESULTS: ");
        console.log(guiObj);
        //console.log(data);
        t0 = (new Date() - t0) / 1000;
        data = jQuery.parseJSON(data);
        var pageSize = data.pageSize;
        var totalPages = Math.ceil(data.totalCount / pageSize);

        var currentPage = $('a.paginate_button.current').text();
        if (!currentPage && data.page === 0) {
            currentPage = 1;
        } else {
            currentPage = data.page;
        }

        createPager(totalPages);

        var multipleSelects = [];
        $('div.dateValues').text('');
        $('input.facet-min').attr('placeholder', '');
        $('input.facet-max').attr('placeholder', '');
        //let commonFacets = findCommonKeys(data.facets, param.facets);
        //createFacetContent(data.facets, param.facets);
        //we have 0 results but already selected facets
        /*
        if (data.totalCount === 0 && Object.keys(commonFacets).length > 0) {
            console.log("zero element but we have selected facets");
            createFacetContent(commonFacets, param.facets);
        } else {
            console.log("zother way");
            createFacetContent(data.facets, param.facets);
        }*/
        var facets = '';
        $.each(data.facets, function (n, fd) {
            var fdp = param.facets[fd.property] || (fd.type === 'continuous' ? {} : []);
            var select = "";
            if (fd.values.length > 0 || fd.min || fd.type === 'map') {
                var div = $(document.getElementById(fd.property + 'values'));
                var text = '';

                if (fd.type === 'continuous' && fdp.distribution >= 2) {
                    $.each(fd.values, function (n, i) {
                        text += i.label + ': ' + i.count + '<br/>';
                    });
                }

                if (fd.type === 'object' || fd.type === 'literal' || fd.type === 'matchProperty' || fd.type === 'linkProperty') {
                    var title_id = fd.label.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').toLowerCase();
                    select = '<select class="facet mt-2 smart-search-multi-select" data-property="' + fd.property + '" id="smart-multi-' + title_id + '" name="' + title_id + '" multiple>';
                    $.each(fd.values, function (n, i) {
                        //iterate the param.facets to set the selected ones!!!!!!
                        if (param.facets[fd.property] && param.facets[fd.property].length > 0) {
                            $.each(param.facets[fd.property], function (sI, sv) {
                                if (sv === i.value) {
                                    select += '<option value="' + i.value + '" data-value="' + fd.property + '" selected>' + shorten(i.label) + ' (' + i.count + ')</option>';
                                }
                            });
                        } else {
                            select += '<option value="' + i.value + '" data-value="' + fd.property + '" >' + shorten(i.label) + ' (' + i.count + ')</option>';
                        }
                    });
                    select += '</select>';
                }

                if (div.length === 0) {
                    if (fd.type === 'continuous') {
                        select += '<div class="row">';
                        select += '<div class="col">';
                        select += '<input class="facet-min form-control" type="text" value="' + (fdp.min || '') + '" data-value="' + fd.property + '" placeholder="' + fd.min + '" />';
                        select += '</div>';
                        select += '<div class="col">';
                        select += '<input class="facet-max form-control" type="text" value="' + (fdp.max || '') + '" data-value="' + fd.property + '" placeholder="' + fd.max + '" />';
                        select += '</div>';
                        select += '</div>';
                    }

                    if (fd.type === 'map') {
                        if (mapPins) {
                            map.removeLayer(mapPins);
                        }
                        //console.log("MAP::::");
                        //console.log(fd.values);
                        if (fd.values !== '') {
                            mapPins = L.geoJSON(JSON.parse(fd.values));
                            mapPins.addTo(map);
                        }
                        select = '<div id="mapLabel"></div>' +
                                '<button type="button" id="mapToggleBtn" class="btn btn-arche-blue w-100">' + Drupal.t('Map') + '</button>';
                    }

                    facets += createFacetSelectCard(fd, select);
                    multipleSelects.push(title_id);

                } else {
                    div.html(select + '<br/>');
                }

            }
            if (fdp.distribution === 1 || fdp.distribution === 3) {
                $('input.facet-min[data-value="' + fd.property + '"]').attr('placeholder', fd.min || '');
                $('input.facet-max[data-value="' + fd.property + '"]').attr('placeholder', fd.max || '');
            }
        });

        $('#facets').html(facets);


        $.each(multipleSelects, function (k, v) {
            $("#smart-multi-" + v).select2({
                placeholder: Drupal.t('Select an option')
            });
        });

        var results = '';
        results += displaySearchResult(data.results);
        $(".discover-left input, .discover-left textarea, .discover-left select, .discover-left button").prop("disabled", false);

        $('.main-content-row').html(results);
        //if the user selected a value from the map then we have to display it.
        displayMapSelectedValue();

        //var countText = countNullText;
        if (!initial) {
            var countText = Drupal.t('0 Result(s)');
            if (data.results.length > 0) {
                countText = data.totalCount + ' ' + Drupal.t("Result(s)");
            } else {
                $('.main-content-row .container').html('<div class="alert alert-warning" role="alert">' + Drupal.t("No result! Please start a new search!") + "</div>");
                //showJustSearchFacets();
    }
            $('#smartSearchCount').html(countText);
        } else {
            $('#smartSearchCount').html('0 ' + Drupal.t("Result(s)"));
            $('.main-content-row .container').html('<div class="alert alert-primary" role="alert">' + Drupal.t("Please start to search") + "</div>");
        }

        //display warnings 
        if (data.messages !== "") {
            displaySearchWarningMessage(data.messages, data.class);
        }
        if (bboxObj !== undefined) {
            if (bboxObj.drawnItems) {
                setMapLabel(bboxObj.drawnItems);
            }
        }

        if (bbox !== undefined) {
            setMapLabel(bbox);
        }

        updateUrl(param);
    }


    /**
     * get the selected facets for the 0 result page
     * @param {type} obj1
     * @param {type} obj2
     * @returns {unresolved}
     */
    function findCommonKeys(obj1, obj2) {
        // Create sets of keys from both objects
        const keys1 = new Set(Object.keys(obj1));
        const keys2 = new Set(Object.keys(obj2));

        // Find the intersection of the two sets
        const commonKeys = [...keys1].filter(key => keys2.has(key));

        // Create a new object to hold the common keys and their values
        const commonObject = {};

        // Add the common keys and their values from both objects to the new object
        commonKeys.forEach(key => {
            commonObject[key] = obj1[key];
        });
        
        Object.keys(commonObject).forEach(function(key) {
            commonObject[key].values = obj2[key]
         });
        
        return commonObject;
    }


    /**
     * Create the search facet box content
     * @param {type} data
     * @param {type} paramFacets
     * @returns {undefined}
     */
    function createFacetContent(data, paramFacets) {
        var facets = "";
        var multipleSelects = [];
        $.each(data, function (n, fd) {
            var fdp = paramFacets[fd.property] || (fd.type === 'continuous' ? {} : []);
            var select = "";
            if (fd.values.length > 0 || fd.min || fd.type === 'map') {
                var div = $(document.getElementById(fd.property + 'values'));
                var text = '';

                if (fd.type === 'continuous' && fdp.distribution >= 2) {
                    $.each(fd.values, function (n, i) {
                        text += i.label + ': ' + i.count + '<br/>';
                    });
                }

                if (fd.type === 'object' || fd.type === 'literal' || fd.type === 'matchProperty' || fd.type === 'linkProperty') {
                    var title_id = fd.label.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').toLowerCase();
                    select = '<select class="facet mt-2 smart-search-multi-select" data-property="' + fd.property + '" id="smart-multi-' + title_id + '" name="' + title_id + '" multiple>';
                    $.each(fd.values, function (n, i) {
                        //iterate the param.facets to set the selected ones!!!!!!
                        if (paramFacets[fd.property] && paramFacets[fd.property].length > 0) {
                            console.log("SELECTED:::");
                            console.log(paramFacets[fd.property]);
                            $.each(paramFacets[fd.property], function (sI, sv) {
                                console.log(i);
                                if (sv === i.value) {
                                    select += '<option value="' + i.value + '" data-value="' + fd.property + '" selected>' + shorten(i.label) + ' (' + i.count + ')</option>';
                                }
                            });
                        } else {
                            select += '<option value="' + i.value + '" data-value="' + fd.property + '" >' + shorten(i.label) + ' (' + i.count + ')</option>';
                        }
                    });
                    select += '</select>';
                }

                if (div.length === 0) {
                    if (fd.type === 'continuous') {
                        select += '<div class="row">';
                        select += '<div class="col">';
                        select += '<input class="facet-min form-control" type="text" value="' + (fdp.min || '') + '" data-value="' + fd.property + '" placeholder="' + fd.min + '" />';
                        select += '</div>';
                        select += '<div class="col">';
                        select += '<input class="facet-max form-control" type="text" value="' + (fdp.max || '') + '" data-value="' + fd.property + '" placeholder="' + fd.max + '" />';
                        select += '</div>';
                        select += '</div>';
                    }

                    if (fd.type === 'map') {
                        if (mapPins) {
                            map.removeLayer(mapPins);
                        }
                        //console.log("MAP::::");
                        //console.log(fd.values);
                        if (fd.values !== '') {
                            mapPins = L.geoJSON(JSON.parse(fd.values));
                            mapPins.addTo(map);
                        }
                        select = '<div id="mapLabel"></div>' +
                                '<button type="button" id="mapToggleBtn" class="btn btn-arche-blue w-100">' + Drupal.t('Map') + '</button>';
                    }

                    facets += createFacetSelectCard(fd, select);
                    multipleSelects.push(title_id);

                } else {
                    div.html(select + '<br/>');
                }

            }
            if (fdp.distribution === 1 || fdp.distribution === 3) {
                $('input.facet-min[data-value="' + fd.property + '"]').attr('placeholder', fd.min || '');
                $('input.facet-max[data-value="' + fd.property + '"]').attr('placeholder', fd.max || '');
            }
        });

        $('#facets').html(facets);


        $.each(multipleSelects, function (k, v) {
            $("#smart-multi-" + v).select2({
                placeholder: Drupal.t('Select an option')
            });
        });

    }
    /**
     * Display warning text on the search page
     * @param {type} message
     * @param {type} cssClass
     * @returns {undefined}
     */
    function displaySearchWarningMessage(message, cssClass) {
        if (typeof message !== 'undefined') {
            $('.main-content-warnings').html('<div class="' + cssClass + ' warning-message-div">' + message + '</div>');
        }
    }

    /**
     * Show the facets boxes on the left menu
     * @param {type} fd
     * @param {type} select
     * @returns {String}
     */
    function createFacetSelectCard(fd, select) {
        var text = "";
        var idStr = fd.label.replace(/[^\w\s]/gi, '');
        idStr = idStr.replace(/\s+/g, '_');
        text += '<div class="card metadata facets">' +
                '<div class="card-header">' +
                '<div class="row justify-content-center align-items-center">' +
                '<div class="col-8"><h6 class="mb-0 pb-0">' + fd.label + '</h6></div>' +
                '<div class="col-2">' +
                '<img src="/browser/themes/contrib/arche-theme-bs/images/common/tooltip_icon.png" class="tooltip-icon-cards">' +
                '</div>' +
                '<div class="col-2 text-end">' +
                '<a class="btn btn-link mdr-card-collapse-btn" data-bs-toggle="collapse" data-bs-target="#' + idStr + '">' +
                '<i class="fa fa-solid fa-chevron-up"></i>' +
                '</a>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div id="' + idStr + '" class="collapse show">' +
                ' <div class="card-body meta-sidebar flex-column">' +
                '<div class="container-fluid">' +
                '<div class="row">' +
                '<div class="col-12 mt-2">' + select + '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';
        return text;
    }

    /**
     * Generate HTML code for the result view
     * @param {type} data
     * @returns {String}
     */
    function displaySearchResult(data) {
        var results = "";
        results += '<div class="container">';

        $.each(data, function (k, result) {
            if (result.title && result.id) {
                var resourceUrl = result.url.replace(/(https?:\/\/)/g, '');

                results += '<div class="row smart-result-row" id="res' + result.id + '" data-value="' + result.id + '">';
                results += '<div class="col-block col-lg-10 discover-table-content-div" data-contentid="' + resourceUrl + '">';
                //title
                results += '<div class="res-property">';
                //results += '<h5 class="h5-blue-title"><button type="button" class="btn btn-sm-add searchInBtn" data-resource-id="' + result.id + '" data-resource-title="' + getLangValue(result.title, preferredLang) + '" >+</button><a href="' + archeBaseUrl + '/browser/metadata/' + result.id + '" taget="_blank">' + getLangValue(result.title, preferredLang) + '</a></h5>';
                results += '<h5 class="h5-blue-title"><a href="' + archeBaseUrl + '/browser/metadata/' + result.id + '" taget="_blank">' + getLangValue(result.title, preferredLang) + '</a></h5>';
                results += '</div>';

                //description
                if (result.description) {
                    results += '<div class="res-property sm-description">';
                    results += getLangValue(result.description, preferredLang);
                    results += '</div>';
                }

                results += '<div class="res-property sm-highlight">';
                if (result.matchHighlight) {
                    results += 'Highlight: ' + result.matchHighlight;
                }

                //results += 'Match score: ' + result.matchWeight + '<br/>';
                if (result.matchProperty.length > 0) {
                    results += 'Matches in:<div class="ml-5">';
                    for (var j = 0; j < result.matchProperty.length; j++) {
                        if (result.matchHiglight && result.matchHiglight[j]) {
                            results += shorten(result.matchProperty[j] || '') + ': ' + result.matchHiglight[j] + '<br/>';
                        } else {
                            results += shorten(result.matchProperty[j] || '') + '<br/>';
                        }
                    }
                    results += '</div>';
                }

                results += getParents(result.parent || false, true, preferredLang);

                results += '</div>';
                results += '<div class="res-property discover-content-toolbar">';

                results += '<p class="btn-toolbar-gray btn-toolbar-text no-btn">' + shorten(result.class[0]) + '</p>';

                if (result.accessRestriction) {
                    results += setAccessRestrictionLabel(result.accessRestriction[0].title['en']);
                    results += result.accessRestriction[0].title[preferredLang].replace(/\n/g, ' / ');
                    results += '</p>';
                }

                if (result.accessRestrictionSummary) {
                    results += setAccessRestrictionLabel(result.accessRestrictionSummary['en']);
                    results += result.accessRestrictionSummary[preferredLang].replace(/\n/g, ' / ');
                    results += '</p>';
                }

                results += '</div>';
                results += '</div>';

                results += '<div class="col-lg-2" data-thumbnailid="' + resourceUrl + '">' +
                        '<div class="col-block discover-table-image-div">\n\
                                    <div class="dt-single-res-thumb text-center" style="min-width: 120px;">\n\
                                        <center><a href="https://arche-thumbnails.acdh.oeaw.ac.at/' + resourceUrl + '?width=600" data-lightbox="detail-titleimage-' + result.id + '">\n\
                                        <img class="img-fluid" src="https://arche-thumbnails.acdh.oeaw.ac.at/' + resourceUrl + '?width=200" >\n\
                                        </a></center>\n\
                                    </div>\n\
                                </div>';

                results += '</div>';
                checkThumbnailImage(resourceUrl);
                results += '</div>';
            }
        });
        return results;
    }


    /**
     * Check the thumbnail, if not exists then hide it and change the divs
     * @param {type} resourceUrl
     * @returns {undefined}
     */
    function checkThumbnailImage(resourceUrl) {
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

    /**
     * 
     * @returns {undefined}
     */
    function displayMapSelectedValue() {
        bbox = guiObj.coordinates;
        if (guiObj.coordinates && guiObj.locationTitle) {
            $('#mapSelectedPlace').html('<h5 class="h5-blue-title"><button id="removeMapSelectedPlace" class="btn btn-sm-add"> - </button>' + guiObj.locationTitle + '</h5>');
        }
    }

    /**
     * set the colors of the restriction labels
     * @param {type} accessText
     * @returns {String}
     */
    function setAccessRestrictionLabel(accessText) {

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

    function searchInAdd(id, title) {

        if ($('#in' + id).length === 1) {
            return;
        }
        var element = $('#res' + id).clone();
        var btn = element.find('button');
        btn.text('-');
        btn.attr('id', 'removeSearchInElementBtn');
        element.attr('id', 'in' + id);
        $('#searchIn').append(element);
    }

    function getParents(parent, top, preferredLang) {
        if (parent === false) {
            return '';
        }
        parent = parent[0];
        var ret = getParents(parent.parent || false, false, preferredLang);
        ret += (ret !== '' ? ' &gt; ' : '') + '<a href="' + archeBaseUrl + '/browser/metadata/' + parent.id + '">' + getLangValue(parent.title) + '</a>';
        if (top) {
            ret = 'In: ' + ret + '<br/>';
        }
        return ret;
    }

    function executeTheSearch() {
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

});
