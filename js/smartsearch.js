jQuery(function ($) {

    "use strict";

    var selectedSearchValues = [];
    var dropdownSearchValues = {};
    var countNullText = '<h5 class="font-weight-bold">' + Drupal.t('No results found') + '</h5>';
    var firstLoad = true;
    var archeSmartSearchUrl = getSmartUrl();
    var token = 1;
    var mapSmall;
    var preferredLang = drupalSettings.arche_core_gui.gui_lang;

    /********************** EVENTS *************************************/

    var archeBaseUrl = getInstanceUrl();
    var actualPage = 1;
    var guiObj = {};
    var smartSearchInputField = $('#sm-hero-str');

    $(document).ready(function () {
        var currentUrl = window.location.href;

        // Check if the URL contains any params
        if (currentUrl.indexOf("/browser/discover/") !== -1) {
            getSearchParamsFromUrl();
            //guiObj = {'actualPage': 1};
        }
        executeTheSearch();
    });

    //// events ////
    $(document).delegate("input", "keypress", function (e) {
        // Check if the Enter key (keyCode 13) is pressed
        if (e.keyCode === 13) {
            console.log("INPUT ENTER!! ");
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
            console.log("SELECT ENTER!! ");
            firstLoad = false;
            // Prevent the default form submission behavior
            e.preventDefault();
            // Trigger a click event on the submit button
            executeTheSearch();
        }
    });
    //handle the select 2 press enter event and trigger a search
    $(document).on('keyup', '.select2-search__field', function (e) {
        if (e.which === 13) {
            e.preventDefault();
            console.log("select2 keyup ENTER!! ");
            firstLoad = false;
            executeTheSearch();
        }
    });

    // Attach keyup event listener to the input field
    smartSearchInputField.on('keyup', function () {
        // Get the current value of the input field
        var inputValue = $(this).val();

        // Check if the input value is at least 2 characters long
        if (inputValue.length >= 2) {
            // Make an AJAX request to your API
            $.ajax({
                url: '/browser/api/smsearch/autocomplete/'+inputValue,
                method: 'GET',
                success: function (data) {
                    var responseObject = $.parseJSON(data);
            
                    // Initialize autocomplete with the retrieved results
                    smartSearchInputField.autocomplete({
                        source: responseObject,
                        autoFocus: true
                    });
                },
                error: function (xhr, status, error) {
                    console.error('Error fetching autocomplete data:', error);
                }
            });
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
    $(document).delegate("#SMMapBtn", "click", function (e) {
        e.preventDefault();
        var coordinates = $(this).data("coordinates");
        var title = $(this).data("location-title");
        $('.arche-smartsearch-page-div').show();
        /*
         $('.main-content-row').html('<div class="container">' +
         '<div class="row">' +
         '<div class="col-12 mt-5">' +
         '<img class="mx-auto d-block" src="/browser/modules/contrib/arche_core_gui/images/arche_logo_flip_47px.gif">' +
         ' </div>' +
         '</div>');*/
        console.log("SMMAP COORDINATES:::");
        console.log(coordinates);
        guiObj = {'coordinates': coordinates, 'locationTitle': title};
        console.log(guiObj);
        firstLoad = false;

        var mapContainer = $('#mapContainer');
        mapContainer.hide();
        displayMapSelectedValue();
    });

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

        // do a topcollection search
        resetSearch();
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

    $(document).delegate("#removeMapSelectedPlace", "click", function (e) {
        e.preventDefault();
        $('#mapSelectedPlace').html('');
        delete guiObj.coordinates;
        delete guiObj.locationTitle;
        search();
    });

    $(document).delegate("#smartPageSize", "change", function (e) {
        guiObj = {'actualPage': 1};
        executeTheSearch();
        e.preventDefault();
    });

    /* SUBMIT THE SMART SEARCH FORM WITH ENTER - NOT WORKING*/
    $('#hero-smart-search-form').on('keydown', 'input', function (event) {
        if (event.which === 13) { // Check if Enter key was pressed (key code 13)
            console.log("ENTER PRESSED");
            firstLoad = false;
            event.preventDefault();
            executeTheSearch();
        }
    });



    ////// FUNCTIONS //////

    function getSearchParamsFromUrl() {
        var url = window.location.pathname;
        var paramsString = url.replace('/browser/discover//', '');
        paramsString = paramsString.replace('/browser/discover/', '');
        paramsString = paramsString.replace('/q', 'q');

        guiObj = convertFacetsIntoObjects(paramsString);

        console.log("PARAMS:::");
        //console.log(params);
        console.log("URL : -> ");
        console.log(url);
        //guiObj = {'q': 'norbert'};
        firstLoad = false;
        //Update form based on the params

        // update tge guisearchparams obj
    }


    function convertFacetsIntoObjects(queryString) {
        var pairs = queryString.split('&');
        // Initialize an empty object to store the result
        var result = {facets: {}};

        // Iterate over the key-value pairs
        pairs.forEach(function (pair) {
            // Split each pair into key and value
            var keyValue = pair.split('=');

            // Decode the key and value
            var key = decodeURIComponent(keyValue[0]);
            var value = decodeURIComponent(keyValue[1]);

            // Check if the key contains array notation
            var matches = key.match(/\[([^[\]]+)\]/g);
            if (matches) {
                // Remove square brackets and split into parts
                var parts = matches.map(function (match) {
                    return match.slice(1, -1);
                });

                // Initialize the nested object/array structure
                var temp = result.facets;
                parts.forEach(function (part, index) {
                    if (index < parts.length - 1) {
                        if (!temp[part]) {
                            // If the next part is a number, initialize an array
                            if (/^\d+$/.test(parts[index + 1])) {
                                temp[part] = [];
                            } else {
                                temp[part] = {};
                            }
                        }
                        temp = temp[part];
                    } else {
                        if (Array.isArray(temp[part])) {
                            // Push the value into the array
                            temp[part].push(value);
                        } else {
                            // Set the value in the object
                            if (!temp[part]) {
                                temp[part] = [];
                            }
                            temp[part].push(value);
                        }
                    }
                });
            } else {
                // If the key does not contain array notation, set the value directly
                result[key] = value;
            }
        });
        return result;
    }

    function getSmartUrl() {
        var baseUrl = window.location.origin + window.location.pathname;
        let instanceUrl = baseUrl.split("/browser")[0];
        var smartUrl = "https://arche-smartsearch.acdh.oeaw.ac.at";

        if (instanceUrl.indexOf('arche-dev.acdh-dev.oeaw.ac.at') !== -1) {
            smartUrl = "https://arche-smartsearch.acdh-dev.oeaw.ac.at";
        } else if (instanceUrl.indexOf('arche-curation.acdh-dev.oeaw.ac.at' !== -1)) {
            smartUrl = "https://arche-smartsearch.acdh-dev.oeaw.ac.at";
        }
        return smartUrl;
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
    //var geonamesAccount = 'zozlak';
    var bbox = '';

    function getGuiSearchParams(prop) {
        if (guiObj.hasOwnProperty(prop)) {
            return guiObj[prop];
        }
    }

    function getLangValue(data, prefLang) {
        prefLang = prefLang || 'en';
        return data[prefLang] || Object.values(data)[0];
    }

    // init search to display just the facets on the first load if we have 0 results
    function showJustSearchFacets() {
        console.log("showJustSearchFacets func");
        token++;
        var localToken = token;
        var pagerPage = (getGuiSearchParams('actualPage') ?? 1) - 1;

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
                initialFacets: true
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

        param.statusCode = function (response) {
            console.log("statusCode");
            console.log(response);
        };

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

    /// if the search is executed by the hero section, we have to update the input field ///
    function updateSearchStrInput(str) {
        if ($('#sm-hero-str').val() === "") {
            $('#sm-hero-str').val(str);
        }
    }

    function search() {
        console.log("search started");
        console.log("SEARCH GUI OBJ; ");
        console.log(guiObj);
        token++;
        var localToken = token;
        if (firstLoad) {
            return showJustSearchFacets();
        }

        var searchStr = $('#sm-hero-str').val();
        var coordinates = (getGuiSearchParams('coordinates')) ? getGuiSearchParams('coordinates') : "";
        var pagerPage = (getGuiSearchParams('actualPage') ?? 1) - 1;
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
                searchIn: []
            }
        };

        $(".smart-search-multi-select").each(function () {
            var prop = $(this).attr('data-property');
            var val = $(this).val();
            if (!(prop in param.data.facets)) {
                param.data.facets[prop] = [];
            }
            param.data.facets[prop].push(val);
            if (!(prop in dropdownSearchValues)) {
                dropdownSearchValues[prop] = [];
            }
            dropdownSearchValues[prop].push($(this));
        });

        $('input.facet:checked').each(function (n, facet) {
            var prop = $(facet).attr('data-value');
            var val = $(facet).val();
            if (!(prop in param.data.facets)) {
                param.data.facets[prop] = [];
            }
            param.data.facets[prop].push(val);
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

        if (bbox !== '') {
            param.data.facets['bbox'] = bbox;
        }

        if (coordinates) {
            if (searchStr.length === 0) {
                firstLoad = false;
            }
            param.data.facets['bbox'] = coordinates;
        }

        console.log("update the url: ");
        updateUrl(param.data);

        var t0 = new Date();
        param.success = function (x) {
            if (token === localToken) {
                console.log("success - param.data: ");
                console.log(param.data);
                showResults(x, param.data, t0);

                /*
                 if (param.data.facets.bbox) {
                 displaySmallMap(param.data.facets.bbox);
                 console.log("BBBOXXX:::: ");
                 console.log(param.data.facets.bbox);
                 }
                 */

            }
        };

        param.fail = function (xhr, textStatus, errorThrown) {
            alert(xhr.responseText);
            $('.main-content-row').html('<div class="alert alert-danger" role="alert">' + Drupal.t("Error! Search API has the following error: " + error) + '</div>');

        };

        param.statusCode = function (response) {
            console.log("statusCode");
            console.log(response);
        };

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
        console.log("SMART SEARCH PARAMS: ");
        console.log(param);
        $.ajax(param);
    }

    /* update the current url after a search was triggered */
    function updateUrl(params) {
        resetsearchUrl();
        var queryString = $.param(params);
        var currentUrl = window.location.href;
        history.pushState(null, "Discover", currentUrl + '/' + queryString);
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

    function displaySmallMap(coordinates) {
        //$("#bboxMap").css('display', 'block');
        mapSmall = L.map('bboxMap', {
            zoomControl: false, // Add zoom control separately below
            center: [48.2, 16.3], // Initial map center
            zoom: 10, // Initial zoom level
            attributionControl: false, // Instead of default attribution, we add custom at the bottom of script
            scrollWheelZoom: false
        });
    }

    /* reset search button clicked */
    function resetSearch() {
        $('input.facet:checked').prop('checked', false);
        $('input.facet-min').val('');
        $('input.facet-max').val('');
        $('.select2-selection__rendered').html('');
        $('#smartSearchCount').html(Drupal.t('0 Result(s)'));
        $('.main-content-row .container').html('<div class="alert alert-warning" role="alert">' + Drupal.t("No result! Please start a new search!") + "</div>");
        guiObj = {};
        guiObj = {'actualPage': 1};
        resetsearchUrl();
        //spatialSelect.setData([{text: 'No filter', value: ''}]);
        showJustSearchFacets();
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

    function showResults(data, param, t0, initial = false) {

        t0 = (new Date() - t0) / 1000;
        data = jQuery.parseJSON(data);
        console.log("SHOW RESULTS:")
        console.log(data);
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
        if (initial || data.results.length > 0) {
            $('input.facet-min').attr('placeholder', '');
            $('input.facet-max').attr('placeholder', '');

            var facets = '';
            $.each(data.facets, function (n, fd) {
                var fdp = param.facets[fd.property] || (fd.type === 'continuous' ? {} : []);
                var select = "";
                if (fd.values.length > 0 || fd.type === 'continuous') {
                    var div = $(document.getElementById(fd.property + 'values'));
                    var text = '';

                    if (fd.type === 'continuous' && fdp.distribution >= 2) {
                        $.each(fd.values, function (n, i) {
                            text += i.label + ': ' + i.count + '<br/>';
                        });
                    }

                    if (fd.type !== 'continuous') {
                        var title_id = fd.label.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').toLowerCase();
                        select = '<select class="facet mt-2 smart-search-multi-select" data-property="' + fd.property + '" id="smart-multi-' + title_id + '" name="' + title_id + '" multiple>';

                        $.each(fd.values, function (n, i) {

                            //iterate the param.facets to set the selected ones!!!!!!
                            if (param.facets[fd.property] && param.facets[fd.property][0].length > 0) {
                                $.each(param.facets[fd.property][0], function (sI, sv) {
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
                            select += '<div class="text-center"><input class="facet-min w-40" placeholder="' + Drupal.t("From") + '" type="text" value="' + (fdp.min || '') + '" data-value="' + fd.property + '"/> - <input class="facet-max w-40" type="text" placeholder="' + Drupal.t("To") + '" value="' + (fdp.max || '') + '" data-value="' + fd.property + '"/></div>';
                        }

                        facets += createFacetSelectCard(fd, select);
                        multipleSelects.push(title_id);

                        //facets += '<label class="mt-2 font-weight-bold">' + fd.label + '</label><br/>' + text + '<br/>';
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
        }

        $.each(multipleSelects, function (k, v) {
            $("#smart-multi-" + v).select2({
                placeholder: Drupal.t('Select an option')
            });
        });

        var results = '';
        results += displaySearchResult(data.results);

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
                console.log("THERE IS NO RESULTS");
                showJustSearchFacets();


            }
            $('#smartSearchCount').html(countText);
        } else {
            $('#smartSearchCount').html('0 ' + Drupal.t("Result(s)"));
            $('.main-content-row .container').html('<div class="alert alert-primary" role="alert">' + Drupal.t("Please start to search") + "</div>");
    }

    }

    function createFacetSelectCard(fd, select) {
        var text = "";
        var idStr = fd.label.replace(/[^\w\s]/gi, '');
        idStr = idStr.replace(/\s+/g, '_');
        text += '<div class="card metadata facets">' +
                '<div class="card-header">' +
                '<div class="row">' +
                '<div class="col-8"><h6>' + fd.label + '</h6></div>' +
                '<div class="col-2 tooltop-icon-div">' +
                '<img src="/browser/themes/contrib/arche-theme-bs/images/common/tooltip_icon.png" class="tooltip-icon">' +
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
                                        <img class="sm-img-list bg-white" src="https://arche-thumbnails.acdh.oeaw.ac.at/' + resourceUrl + '?width=300" >\n\
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

    ///  we have to check the thumbnail is existing or not, if not then hide it. ///
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

    function displayMapSelectedValue() {
        bbox = guiObj.coordinates;
        if (guiObj.coordinates && guiObj.locationTitle) {
            $('#mapSelectedPlace').html('<h5 class="h5-blue-title"><button id="removeMapSelectedPlace" class="btn btn-sm-add"> - </button>' + guiObj.locationTitle + '</h5>');
        }

    }

    /* set the colors of the restriction labels*/
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
            $.each(matches, function (k, v) {
                if (v === 'public') {
                    publicText = true;
                } else if (v === 'restricted') {
                    restrictedText = true;
                } else if (v === 'academic') {
                    academicText = true;
                }
            });

            if (publicText && restrictedText) {
                return '<p class="btn-toolbar btn-toolbar-public-restricted no-btn">';
            } else if (publicText && academicText) {
                return '<p class="btn-toolbar btn-toolbar-public-academic no-btn">';
            } else if (restrictedText && academicText) {
                return '<p class="btn-toolbar btn-toolbar-academic-restricted no-btn">';
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

    function formatDate(originalDate) {
        // Create a new Date object from the original date string
        var dateObject = new Date(originalDate);

        // Get the day, month, and year components from the date object
        var day = dateObject.getDate();
        var month = dateObject.toLocaleString('default', {month: 'short'});
        var year = dateObject.getFullYear();

        // Concatenate the components to form the desired format
        return day + ' ' + month + ' ' + year;
    }
});
