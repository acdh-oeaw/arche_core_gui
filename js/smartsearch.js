jQuery(function ($) {

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
        window.firstLoad = true;
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
        window.actualPage = parseInt($(this).text());
        window.guiObj = {'actualPage': window.actualPage};
        window.executeTheSearch()
        e.preventDefault();
    });

    $(document).delegate("#smartPageSize", "change", function (e) {
        window.guiObj = {'actualPage': 1};
        executeTheSearch();
        e.preventDefault();
    });

    $(document).delegate("#mapToggleBtn", "click", function (e) {
        e.preventDefault();
        $('.sm-map').css('top', $('.sm-map').css('top') == '0px' ? -2000 : 0);
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
            var coordinates = (window.guiObj.facets !== undefined && window.guiObj.facets.map !== undefined) ? window.guiObj.facets.map : "";
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
            window.bboxObj = {};
            var layer = event.layer;
            map.removeLayer(layer);
            drawnItems.addLayer(layer);

            window.bboxObj = {drawnItems};
            setMapLabel(drawnItems);
        });

        map.on('draw:drawstart', function (event) {
            var layer = event.layer;
            if(layer) {
                map.removeLayer(layer);
                drawnItems.clearLayers();
            }
        });

        map.on('draw:deleted', function (event) {
            var layer = event.layer;
            map.removeLayer(layer);
            $('#mapLabel').html('');
            $('.sm-map').css('top', '-1000px');
            $('.sm-map').css('display', 'block');
        });

        window.bbox = drawnItems;

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
        var paramsString = "";
        if (url.split('/browser/discover?')[1]) {
            paramsString = url.split('/browser/discover?')[1];
        } else {
            paramsString = url.split('/browser/discover/')[1];
        }

        paramsString = paramsString.replace('?q', 'q');

        window.guiObj = {};
        window.guiObj = parseQueryString(paramsString);
        window.firstLoad = false;
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


    //////////////// SMART SEARCH ///////////////////

  
    

    /**
     * The basic jsut facet display search function
     * @returns {undefined}
     */
    function showJustSearchFacets() {
        window.token++;
        var localToken = window.token;
        var pagerPage = (window.getGuiSearchParams('actualPage') ?? 1) - 1;
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
        var pagerPage = (window.getGuiSearchParams('actualPage') ?? 1) - 1;
        //var guiFacets_ = (getGuiSearchParams('facets')) ? getGuiSearchParams('facets') : {};

        if (searchStr === "") {
            searchStr = (window.getGuiSearchParams('q')) ? window.getGuiSearchParams('q') : "";
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

        if ($('#searchInChb:checked').length === 1) {
            $('#searchIn > div').each(function (n, el) {
                param.data.searchIn.push($(el).attr('data-value'));
            });
        }

        if (window.bboxObj.drawnItems) {
            if (window.bboxObj.drawnItems.getLayers().length > 0) {
                var coord = window.bboxObj.drawnItems.getLayers()[0].toGeoJSON().geometry.coordinates[0];
                param.data.facets['map'] = 'POLYGON((' + coord.map((x) => x[0] + ' ' + x[1]).join(',') + '))';
            }
        }

        //updateUrl(param.data);
        var t0 = new Date();
        param.success = function (x) {
            if (window.token === localToken) {
                console.log("search ajax success - param.data: ");
                console.log(param.data);
                window.showResults(x, param.data, t0);
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
            window.location.href = previousUrl;
        }
    }

    window.executeTheSearch = function() {
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

});
