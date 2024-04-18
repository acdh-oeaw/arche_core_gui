jQuery(function ($) {

    "use strict";

    var selectedSearchValues = [];
    var dropdownSearchValues = {};
    var countNullText = '<h5 class="font-weight-bold">' + Drupal.t('No results found') + '</h5>';
    var firstLoad = true;
    var archeSmartSearchUrl = getSmartUrl();
    var token = 1;
    var mapSmall;

    /********************** EVENTS *************************************/

    var archeBaseUrl = getInstanceUrl();
    var actualPage = 1;
    var guiObj = {};
    $(document).ready(function () {

        var currentUrl = window.location.href;

        // Check if the URL contains the desired substring
        if (currentUrl.indexOf("/browser/discover/") !== -1) {
            var lastParams = getLastUrlSegment();
            if (lastParams.last) {
                firstLoad = false;
                $('#sm-hero-str').val(lastParams.last);
                guiObj = {'searchStr': lastParams.last};
            }
        }
        executeTheSearch();
        fetchSearchDateFacet();
    });

    //// events ////
    // not working now



    $(".smart-search-multi-select").on("change", function (event) {
        console.log('itt');
        var selectId = $(this).attr('id');
        var selectedValue = $(this).val();

        // Output the ID and value for demonstration
        console.log('Select2 ID: ' + selectId + ', Selected Value: ' + selectedValue);
    });

    $(".smart-search-multi-select").on("select", function (event) {
        console.log('itt 1');
        var selectId = $(this).attr('id');
        var selectedValue = $(this).val();

        // Output the ID and value for demonstration
        console.log('Select2 ID: ' + selectId + ', Selected Value: ' + selectedValue);
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
        $('.arche-smartsearch-page-div').show();
        $('.main-content-row').html('<div class="container">' +
                '<div class="row">' +
                '<div class="col-12 mt-5">' +
                '<img class="mx-auto d-block" src="/browser/modules/contrib/arche_core_gui/images/arche_logo_flip_47px.gif">' +
                ' </div>' +
                '</div>');
        console.log("SMMAP COORDINATES:::");
        console.log(coordinates);
        guiObj = {'coordinates': coordinates};
        console.log(guiObj);
        firstLoad = false;
        search();
        var mapContainer = $('#mapContainer');
        mapContainer.hide();
    });

    $(document).delegate(".resetSmartSearch", "click", function (e) {
        firstLoad = true;
        e.preventDefault();
        $('#block-smartsearchblock input[type="text"]').val('');
        $('#block-smartsearchblock input[type="search"]').val('');
        $('#block-smartsearchblock input[type="checkbox"]').prop('checked', false);
        $('#block-smartsearchblock textarea').val('');
        $('#block-smartsearchblock select').val('');
        // do a topcollection search
        resetSearch();
    });

    //main search block
    $(document).delegate(".smartsearch-btn", "click", function (e) {
        e.preventDefault();
        firstLoad = false;
        executeTheSearch();

    });

    $(document).delegate(".paginate_button", "click", function (e) {
        actualPage = parseInt($(this).text());
        executeTheSearch(actualPage)
        e.preventDefault();
    });

    /* HIDE THE EXTENDED SEARCH IF THE USER CLICKED OUTSIDE - NOT WORKING */
    $(document).on("click", function (event) {
        var popupExtSearch = $(".extendedSearchCard");
        var extSearchButton = $(".extendedSearcBtn");
        // Check if the clicked element is not the popup or the toggle button
        //if (!popupExtSearch.is(event.target) && !extSearchButton.is(event.target) && popupExtSearch.has(event.target).length === 0) {
        //    popupExtSearch.hide();
        //}
    });

    /* SUBMIT THE SMART SEARCH FORM WITH ENTER - NOT WORKING*/
    var form = document.getElementById("hero-smart-search-form");
    if (form) {
        form.addEventListener("keydown", function (event) {
            // Check if the pressed key is "Enter" (key code 13)
            if (event.key === "Enter") {
                executeTheSearch();
                event.preventDefault();
            }
        });
    }

    ////// FUNCTIONS //////

    function getLastUrlSegment() {
        var path = window.location.pathname;
        var segments = path.split('/');
        var lastSegment = segments[segments.length - 1];
        var secondLastSegment = segments[segments.length - 2];
        return {"last": lastSegment, "second": secondLastSegment};
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
    var spatialSelect;
    var bbox = '';


    function fetchSearchDateFacet() {
        $.ajax({
            url: '/browser/api/smartSearchDateFacet',
            success: function (data) {
                data = jQuery.parseJSON(data);
                $.each(data, function (k, v) {

                    var idStr = v.label.replace(/[^\w\s]/gi, '');
                    idStr = idStr.replace(/\s+/g, '_');
                    var facet = '<div class="card metadata facets">' +
                            '<div class="card-header">' +
                            '<div class="row">' +
                            '<div class="col-8"><h6>' + v.label + '</h6></div>' +
                            '<div class="col-2 tooltop-icon-div">' +
                            '<img src="/browser/themes/contrib/arche-theme-bs/images/common/tooltip_icon.png" class="tooltip-icon">' +
                            '</div>' +
                            '<div class="col-2 text-end">' +
                            '<a class="btn btn-link mdr-card-collapse-btn" data-bs-toggle="collapse" data-bs-target="#' + idStr + '">' +
                            '<i class="fa fa-solid fa-chevron-up"></i></a>' +
                            '</div>' +
                            '</div>' +
                            '</div>' +
                            '<div id="' + idStr + '" class="collapse show">' +
                            '<div class="card-body meta-sidebar flex-column">' +
                            '<div class="container-fluid">' +
                            '<div class="row">' +
                            '<div class="col-12 mt-2">' +
                            '<input type="checkbox" class="distribution mt-2" value="1" data-value="' + k + '"/> show distribution<br/>' +
                            '<input type="checkbox" class="range mt-2" value="1" data-value="' + k + '"/> show range' +
                            '<div id="' + k + 'Values" class="dateValues"></div>' +
                            '<div class="row mt-2">' +
                            '<div class="col-lg-5"> <input class="facet-min w-100" type="number" data-value="' + k + '"/> </div>' +
                            '<div class="col-lg-1"> - </div>' +
                            '<div class="col-lg-5"><input class="facet-max w-100" type="number" data-value="' + k + '"/> </div>' +
                            '</div>' +
                            '</div>' +
                            '</div>' +
                            '</div>' +
                            '</div>';
                    $('#dateFacets').append(facet);
                });
            }
        });
    }

    function createSelectedValuesForForm(obj) {
        // Fetch the id attribute
        var idValue = obj.attr("id");
        var classValue = obj.attr("class");
        var dataValue = obj.attr("data-value");
        var value = obj.val();
        var object = new Object();

        if (idValue) {
            object.id = idValue;
        }
        if (classValue) {
            object.class = classValue;
        }
        if (dataValue) {
            object.data = dataValue;
        }
        if (value) {
            object.value = value;
        }
        return object;
    }

    function getGuiSearchParams(prop) {
        if (guiObj.hasOwnProperty(prop)) {
            return guiObj[prop];
        }
    }

    function getLangValue(data, prefLang) {
        prefLang = prefLang || 'en';
        return data[prefLang] || Object.values(data)[0];
    }


    function showJustSearchFacets() {
        console.log("showJustSearchFacets");
        token++;
        var localToken = token;
        var actualPage = (getGuiSearchParams('actualPage')) ? getGuiSearchParams('actualPage') : 0;

        var param = {
            url: '/browser/api/smartsearch',
            method: 'get',
            data: {
                q: "",
                preferredLang: drupalSettings.arche_core_gui.gui_lang,
                includeBinaries: 0,
                linkNamedEntities: 0,
                page: actualPage,
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
        param.fail = function (xhr, textStatus, errorThrown) {
            alert(xhr.responseText);
        };

        param.statusCode = function (response) {
            console.log("statusCode");
            console.log(response);
        };

        param.error = function (xhr, status, error) {
            var err = eval(xhr.responseText);
            console.log(xhr);
            console.log(status);
            console.log(error);
            console.log(xhr.responseText);
        };
        $.ajax(param);
    }

    function search() {
        token++;
        var localToken = token;
        if (firstLoad) {
            return showJustSearchFacets();
        }
        var searchStr = (getGuiSearchParams('searchStr')) ? getGuiSearchParams('searchStr') : "";
        var coordinates = (getGuiSearchParams('coordinates')) ? getGuiSearchParams('coordinates') : "";
        var actualPage = (getGuiSearchParams('actualPage')) ? getGuiSearchParams('actualPage') : 0;
        console.log("coordinates in search:::: ");
        console.log(coordinates);
        searchStr = $('#sm-hero-str').val();

        var page = $('a.paginate_button.current').text();
        if (page && page !== actualPage) {
            actualPage = page;
        }

        var param = {
            url: '/browser/api/smartsearch',
            method: 'get',
            data: {
                q: searchStr,
                preferredLang: drupalSettings.arche_core_gui.gui_lang,
                includeBinaries: $('#inBinary').is(':checked') ? 1 : 0,
                linkNamedEntities: $('#linkNamedEntities').is(':checked') ? 1 : 0,
                page: actualPage,
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

        var t0 = new Date();
        param.success = function (x) {
            if (token === localToken) {
                console.log("success - param.data: ");
                console.log(param.data);
                console.log("update multi gui");
                //updateMultiSelectGui(param.data.facets);
                showResults(x, param.data, t0);

                if (param.data.facets.bbox) {
                    displaySmallMap(param.data.facets.bbox);
                    console.log("BBBOXXX:::: ");
                    console.log(param.data.facets.bbox);
                }


            }
        };
        param.fail = function (xhr, textStatus, errorThrown) {
            alert(xhr.responseText);
        };

        param.statusCode = function (response) {
            console.log("statusCode");
            console.log(response);
        };

        param.error = function (xhr, status, error) {
            var err = eval(xhr.responseText);
            console.log(xhr);
            console.log(status);
            console.log(error);
            console.log(xhr.responseText);
        };

        console.log("SMART SEARCH PARAMS: ");
        console.log(param);
        $.ajax(param);
    }

    function displaySmallMap(coordinates) {
        //$("#bboxMap").css('display', 'block');
        mapSmall = L.map('bboxMap', {
            zoomControl: false, // Add zoom control separately below
            center: [48.2, 16.3], // Initial map center
            zoom: 10, // Initial zoom level
            attributionControl: false, // Instead of default attribution, we add custom at the bottom of script
            scrollWheelZoom: false
        })

    }

    function resetSearch() {
        $('input.facet:checked').prop('checked', false);
        $('input.facet-min').val('');
        $('input.facet-max').val('');
        $('#preferredLang').val('');
        $('.select2-selection__rendered').html('');
        $('#smartSearchCount').html(Drupal.t('<h5 class="font-weight-bold">No results found</h5>'));
        actualPage = 1;
        //spatialSelect.setData([{text: 'No filter', value: ''}]);
        search("", "", 1);
    }

    function createPager(totalPages, resultsPerPage) {

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
        var totalPages = Math.floor(data.totalCount / pageSize);

        var currentPage = $('a.paginate_button.current').text();
        if (!currentPage && data.page === 0) {
            currentPage = 1;
        } else {
            currentPage = data.page;
        }
        createPager(totalPages, pageSize, currentPage);
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
                    
                    if(fd.type !== 'continuous') {
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
                            select += '<div class="text-center"><input class="facet-min w-40" type="text" value="' + (fdp.min || '') + '" data-value="' + fd.property + '"/> - <input class="facet-max w-40" type="text" value="' + (fdp.max || '') + '" data-value="' + fd.property + '"/></div>';
                        }

                        var idStr = fd.label.replace(/[^\w\s]/gi, '');
                        idStr = idStr.replace(/\s+/g, '_');
                        facets += '<div class="card metadata facets">' +
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

        var prefLang = $('#preferredLang').val();
        var results = '';
        results += '<div class="container">';

        $.each(data.results, function (k, result) {
            if (result.title && result.id) {
                results += '<div class="row smart-result-row" id="res' + result.id + '" data-value="' + result.id + '">';
                results += '<div class="col-block col-lg-10 discover-table-content-div">';
                //title
                results += '<div class="res-property">';
                results += '<h5 class="h5-blue-title"><button type="button" class="btn btn-sm-add searchInBtn" data-resource-id="' + result.id + '" data-resource-title="' + getLangValue(result.title, prefLang) + '" >+</button><a href="' + archeBaseUrl + '/browser/metadata/' + result.id + '" taget="_blank">' + getLangValue(result.title, prefLang) + '</a></h5>';
                results += '</div>';
                //description
                results += '<div class="res-property sm-description">';
                if (result.matchHighlight) {
                    //results += getLangValue(result.description, prefLang);
                    results += result.matchHighlight;
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
                var parents = getParents(result.parent || false, true, prefLang);
                results += parents;
                results += '</div>';
                results += '<div class="res-property discover-content-toolbar">';
                results += '<p class="btn btn-toolbar-gray btn-toolbar-text no-btn">' + shorten(result.class[0]) + '</p>';
                results += '<p class="btn btn-toolbar-blue btn-toolbar-text no-btn">' + formatDate(result.availableDate) + '</p>';
                results += '</div>';
                results += '</div>';

                var resourceUrl = result.url.replace(/(https?:\/\/)/g, '');
                results += '<div class="col-lg-2">' +
                        '<div class="col-block discover-table-image-div">\n\
                                        <div class="dt-single-res-thumb text-center" style="min-width: 120px;">\n\
                                            <center><a href="https://arche-thumbnails.acdh.oeaw.ac.at/' + resourceUrl + '?width=600" data-lightbox="detail-titleimage-' + result.id + '">\n\
                                            <img class="sm-img-list bg-white" src="https://arche-thumbnails.acdh.oeaw.ac.at/' + resourceUrl + '?width=300">\n\
                                            </a></center>\n\
                                        </div>\n\
                                    </div>';
                results += '</div>';
                results += '</div>';
            }
        });
        $('.main-content-row').html(results);

        //var countText = countNullText;
        if (!initial) {
            var countText = '<h5 class="font-weight-bold">No results found</h5>';
            if (data.results.length > 0) {
                countText = data.totalCount + ' ' + Drupal.t("Result(s)");
            }
            $('#smartSearchCount').html(countText);
        } else {
            $('#smartSearchCount').html('0 ' + Drupal.t("Result(s)"));
            $('.main-content-row .container').html('<div class="alert alert-primary" role="alert">' + Drupal.t("Please start to search") + "</div>");
    }
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

    function getParents(parent, top, prefLang) {
        if (parent === false) {
            return '';
        }
        parent = parent[0];
        var ret = getParents(parent.parent || false, false, prefLang);
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
        console.log("update:::::");
        console.log(data);
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
