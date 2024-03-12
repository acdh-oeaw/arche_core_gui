jQuery(function ($) {

    "use strict";

    var selectedSearchValues = [];

    var firstLoad = true;
    var archeSmartSearchUrl = getSmartUrl();

    /********************** EVENTS *************************************/

    var archeBaseUrl = getInstanceUrl();
    var actualPage = 1;
    $(document).ready(function () {
        
        var currentUrl = window.location.href;
        
        // Check if the URL contains the desired substring
        if (currentUrl.indexOf("/browser/discover/") !== -1) {
            var lastParam = getLastUrlSegment();
            if (lastParam) {
                firstLoad = false;
                $('#sm-hero-str').val(lastParam);
            }
        }
        executeTheSearch();
    });

    // let metaValueField = $("input[name='metavalue']").val().replace(/[^a-z0-9öüäéáűúőóüöíß:./-\s]/gi, '').replace(/[\s]/g, '+');
    $(document).delegate("#sks-form-front", "submit", function (e) {
        e.preventDefault();

        let searchParam = $('#sm-hero-str').val();
        $('.main-content-row').html('<div class="container">' +
                '<div class="row">' +
                '<div class="col-12 mt-5">' +
                '<img class="mx-auto d-block" src="/browser/modules/contrib/arche_core_gui/images/arche_logo_flip_47px.gif">' +
                ' </div>' +
                '</div>');
        window.location.href = '/browser/search/?q=' + searchParam;
    });


    $(document).delegate("#SMMapBtn", "click", function (e) {
        e.preventDefault();
        var coordinates = $(this).attr("data-coordinates");
        $('.arche-smartsearch-page-div').show();
        $('.main-content-row').html('<div class="container">' +
                '<div class="row">' +
                '<div class="col-12 mt-5">' +
                '<img class="mx-auto d-block" src="/browser/modules/contrib/arche_core_gui/images/arche_logo_flip_47px.gif">' +
                ' </div>' +
                '</div>');
        search("", coordinates);
        var mapContainer = $('#mapContainer');
        mapContainer.hide();
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
        btn.attr('onclick', '$(this).parent().parent().parent().remove();');
        element.attr('id', 'in' + id);
        element.attr('class', 'searchInElement');
        element.addClass('row');
        $('#searchIn').append(element);
        countSearchIn();
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
        firstLoad = false;
        executeTheSearch()
        e.preventDefault();
    });

    $(document).delegate(".paginate_button", "click", function (e) {
        actualPage = parseInt($(this).text());
        console.log("new actual page: " + actualPage);
        executeTheSearch(actualPage)
        e.preventDefault();
    });

    /* SUBMIT THE SMART SEARCH FORM WITH ENTER*/
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


    /* HIDE THE EXTENDED SEARCH IF THE USER CLICKED OUTSIDE */
    $(document).on("click", function (event) {
        var popupExtSearch = $(".extendedSearchCard");
        var extSearchButton = $(".extendedSearcBtn");
        // Check if the clicked element is not the popup or the toggle button
        //if (!popupExtSearch.is(event.target) && !extSearchButton.is(event.target) && popupExtSearch.has(event.target).length === 0) {
        //    popupExtSearch.hide();
        //}
    });


    function getLastUrlSegment() {
        var path = window.location.pathname;
        var segments = path.split('/');
        return segments.pop() || segments.pop(); // Remove any trailing slash
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

    function countSearchIn() {
        var count = $('.searchInElement').length;
        if (count > 0) {
            $(".searchOnlyInBtn").removeClass('d-none');
        }
        $(".searchOnlyInBtn").html('Search only in ( ' + count + ' ) ');
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
    var geonamesAccount = 'zozlak';
    var spatialSelect;
    var bbox = '';


    function fetchFacet() {
        $.ajax({
            url: '/browser/api/smartSearchDateFacet',
            success: function (data) {
                data = jQuery.parseJSON(data);
                $.each(data, function (k, v) {
                    var facet = '<div class="mt-2">' +
                            '<label class="mt-2 font-weight-bold" >' + v.label + '</label><br/>' +
                            '<input type="checkbox" class="distribution mt-2" value="1" data-value="' + k + '"/> show distribution<br/>' +
                            '<input type="checkbox" class="range mt-2" value="1" data-value="' + k + '"/> show range' +
                            '<div id="' + k + 'Values" class="dateValues"></div>' +
                            '<div class="row mt-2">' +
                            '<div class="col-lg-5"> <input class="facet-min w-100" type="number" data-value="' + k + '"/> </div>' +
                            '<div class="col-lg-1"> - </div>' +
                            '<div class="col-lg-5"><input class="facet-max w-100" type="number" data-value="' + k + '"/> </div>' +
                            '</div>'
                    '</div>'
                    '<hr/>';
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

    $(document).ready(function () {

        $("#block-smartsearchblock").on("change", "input", function (event) {
            executeTheSearch();
            selectedSearchValues.push(createSelectedValuesForForm($(this)));
            event.preventDefault();
        });

        $("#block-smartsearchblock").on("change", "select", function (event) {
            executeTheSearch();
            selectedSearchValues.push(createSelectedValuesForForm($(this)));
            event.preventDefault();
        });

        fetchFacet();

        if (form) {
            spatialSelect = new SlimSelect({
                select: '#spatialSelect',
                events: {
                    search: function (phrase, curData) {
                        return new Promise((resolve, reject) => {
                            if ($('#spatialSource').val() === 'arche') {
                                fetch(archeSmartSearchUrl + '/places.php?q=' + encodeURIComponent(phrase))
                                        .then(function (response) {
                                            return response.json();
                                        })
                                        .then(function (data) {
                                            data = data.map(function (x) {
                                                return {
                                                    text: x.label + ' (' + shorten(x.match_property) + ': ' + x.match_value + ')',
                                                    value: x.id
                                                }
                                            });
                                            data.unshift({text: 'No filter', value: ''});

                                            resolve(data);
                                        });
                            } else {
                                fetch('https://secure.geonames.org/searchJSON?fuzzy=0.7&maxRows=10&username=' + encodeURIComponent(geonamesAccount) + '&name=' + encodeURIComponent(phrase))
                                        .then(function (response) {
                                            return response.json();
                                        })
                                        .then(function (data) {
                                            var options = data.geonames.map(function (x) {
                                                return {
                                                    text: x.name + ' (' + x.fcodeName + ', ' + (x.countryName || '') + ')',
                                                    value: x.geonameId
                                                };
                                            });
                                            options.unshift({text: 'No filter', value: ''});
                                            resolve(options);
                                        });
                            }
                        });
                    },
                    afterChange: function (value) {
                        bbox = '';
                        if (value[0].value !== '') {
                            $('#wait').show();
                            $.ajax({
                                method: 'GET',
                                url: 'https://secure.geonames.org/getJSON?username=' + encodeURIComponent(geonamesAccount) + '&geonameId=' + encodeURIComponent(value[0].value),
                                success: function (d) {
                                    if (d.bbox || false) {
                                        d = d.bbox;
                                        bbox = 'POLYGON((' + d.west + ' ' + d.south + ', ' + d.west + ' ' + d.north + ', ' + d.east + ' ' + d.north + ', ' + d.east + ' ' + d.south + ',' + d.west + ' ' + d.south + '))';
                                    } else {
                                        bbox = 'POINT( ' + d.lng + ' ' + d.lat + ')';
                                    }
                                    $('#linkNamedEntities').prop('checked', true);
                                },
                                error: function (xhr, error, code) {
                                    $('.main-content-row').html(error);
                                }
                            });
                        }
                    }
                }
            });
        }
    });

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

    function getLangValue(data, prefLang) {
        prefLang = prefLang || 'en';
        return data[prefLang] || Object.values(data)[0];
    }
    var token = 1;

    function search(searchStr = "", coordinates = "", actualPage = 0) {

        token++;
        var localToken = token;
        if (!searchStr) {
            searchStr = $('#sm-hero-str').val();
            console.log("VAN SEARCH STR: " + searchStr);
        }
        var page = $('a.paginate_button.current').text();
        if (page && page !== actualPage) {
            actualPage = page;
        }

        //addPager();
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

        if (firstLoad) {
            prama.data.linkNamedEntities = 0;
            param.data.facets['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'] = {};
            param.data.facets['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'] = ['https://vocabs.acdh.oeaw.ac.at/schema#TopCollection'];
        }

        var t0 = new Date();
        param.success = function (x) {
            if (token === localToken) {
                showResults(x, param.data, t0);
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
        if (coordinates) {
            param.data.facets['bbox'] = coordinates;
        }
        console.log("SMART SEARCH PARAMS: ");
        console.log(param);
        $.ajax(param);
    }

    function resetSearch() {
        $('input.facet:checked').prop('checked', false);
        $('input.facet-min').val('');
        $('input.facet-max').val('');
        $('#preferredLang').val('');
        actualPage = 1;
        spatialSelect.setData([{text: 'No filter', value: ''}]);
        search("", "", 1);
    }

    function createPager(totalPages, resultsPerPage) {

        $('#smartsearch-pager').empty();


        // Add page numbers
        console.log("ENDPAGE: " + endPage);
        console.log("STARTPAGE: " + startPage);
        console.log("actualPage: " + actualPage);
        console.log("totalPages: " + totalPages);



        var startPage = Math.max(actualPage - 2, 1);
        var endPage = Math.min(startPage + 5, totalPages);

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

        // Add "..." if there are more pages
        /*
         if (endPage > 6) {
         $('#smartsearch-pager').append('<span>...</span>');
         $('#smartsearch-pager').append('<a href="#"  class="paginate_button" data-page="' + totalPages + '">' + totalPages + '</a>');
         }*/

        // Add "Next" button
        if (actualPage < totalPages) {
            $('#smartsearch-pager').append('<a href="#"  class="paginate_button next" data-page="' + (actualPage + 1) + '">></a>');
        }
    }

    function showResults(data, param, t0) {

        t0 = (new Date() - t0) / 1000;
        data = jQuery.parseJSON(data);

        console.log(data);
        console.log("actualPage" + actualPage);
        var pageSize = data.pageSize;
        var totalPages = Math.floor(data.totalCount / pageSize);

        var currentPage = $('a.paginate_button.current').text();
        if (!currentPage && data.page === 0) {
            currentPage = 1;
        } else {
            currentPage = data.page;
        }
        createPager(totalPages, pageSize, currentPage);

        $('div.dateValues').text('');
        if (data.results.length > 0) {
            $('input.facet-min').attr('placeholder', '');
            $('input.facet-max').attr('placeholder', '');
            var facets = '<div class="row"><div class="col-lg-12"><button type="button" class="btn btn-info w-100 resetSmartSearch">Reset filters</button></div></div><br/>';
            $.each(data.facets, function (n, fd) {
                var fdp = param.facets[fd.property] || {};
                if (fd.values.length > 0) {
                    var div = $(document.getElementById(fd.property + 'Values'));
                    var text = '';
                    if (fd.continues && fdp.distribution >= 2) {
                        $.each(fd.values, function (n, i) {
                            text += i.label + ': ' + i.count + '<br/>';
                        });
                    }
                    if (!fd.continues) {
                        $.each(fd.values, function (n, i) {
                            var checked = '';//fdp.indexOf(i.value) >= 0 ? 'checked="checked"' : ''
                            text += '<input class="facet mt-2" type="checkbox" value="' + i.value + '" data-value="' + fd.property + '" ' + checked + '/> ' + shorten(i.label) + ' (' + i.count + ')<br/>';
                        });
                    }
                    if (div.length === 0) {
                        if (fd.continues && fdp.distribution >= 2) {
                            text += '<input class="facet-min w-25" type="text" value="' + (fdp.min || '') + '" data-value="' + fd.property + '"/> - <input class="facet-max w-25" type="text" value="' + (fdp.max || '') + '" data-value="' + fd.property + '"/>';
                        }
                        facets += '<label class="mt-2 font-weight-bold">' + fd.label + '</label><br/>' + text + '<br/>';
                    } else {
                        div.html(text + '<br/>');
                    }
                }
                if (fdp.distribution === 1 || fdp.distribution === 3) {
                    $('input.facet-min[data-value="' + fd.property + '"]').attr('placeholder', fd.min || '');
                    $('input.facet-max[data-value="' + fd.property + '"]').attr('placeholder', fd.max || '');
                }
            });
            $('#facets').html(facets);
        }


        var prefLang = $('#preferredLang').val();
        var results = '';
        results += '<div class="container">';

        var countText = '<h5 class="font-weight-bold">No results found</h5>';
        if (data.results.length > 0) {
            countText = data.totalCount + ' ' + Drupal.t("Result(s)");
        }
        $('#smartSearchCount').html(countText);

        $.each(data.results, function (k, result) {
            if (result.title && result.id) {
                results += '<div class="row smart-result-row" id="res' + result.id + '" data-value="' + result.id + '">';

                results += '<div class="col-block col-lg-10 discover-table-content-div">';
                //title
                results += '<div class="res-property">';
                results += '<h5 class="h5-blue-title"><a href="' + archeBaseUrl + '/browser/metadata/' + result.id + '" taget="_blank">' + getLangValue(result.title, prefLang) + '</a></h5>';
                results += '</div>';

                results += '<div class="res-property sm-description">';
                if (result.description) {
                    results += getLangValue(result.description, prefLang);
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
                }
                results += getParents(result.parent || false, true, prefLang);
                results += '</div>';
                if (!firstLoad) {
                    results += '</div>';
                }
                results += '<div class="res-property discover-content-toolbar">';
                results += '<p class="btn btn-toolbar-grey btn-toolbar-text no-btn">' + shorten(result.class[0]) + '</p>';
                results += '<p class="btn btn-toolbar-blue btn-toolbar-text no-btn">' + formatDate(result.availableDate) + '</p>';
                results += '</div>';
                results += '</div>';

                var resourceUrl = result.url.replace(/(https?:\/\/)/g, '');
                results += '<div class="col-lg-2">' +
                        '<div class="col-block discover-table-image-div"><div class="dt-single-res-thumb text-center" style="min-width: 120px;">\n\
                            <center><a href="https://arche-thumbnails.acdh.oeaw.ac.at/' + resourceUrl + '?width=600" data-lightbox="detail-titleimage-' + result.id + '">\n\
                                <img class="sm-img-list bg-white" src="https://arche-thumbnails.acdh.oeaw.ac.at/' + resourceUrl + '?width=300">\n\
                            </a></center>\n\
                            </div></div>';
                results += '</div>';
                results += '</div></div>';
            }
        });
        $('.main-content-row').html(results);
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

    function executeTheSearch(actualPage) {
        $('.arche-smartsearch-page-div').show();
        $('.main-content-row').html('<div class="container">' +
                '<div class="row">' +
                '<div class="col-12 mt-5">' +
                '<img class="mx-auto d-block" src="/browser/modules/contrib/arche_core_gui/images/arche_logo_flip_47px.gif">' +
                ' </div>' +
                '</div>');
        search("", "", actualPage);
    }


    /** NOT IN USE **/
    function addPager() {
        $('.main-content-row').html('<div id="block-mainpagesearchtools" class="col-block col-lg-12">' +
                '<div class="container">' +
                '<div class="row">' +
                '<div class="col-lg-12 arche-smartsearch-page-div" style="display: none;">' +
                '<div class="row">' +
                '<div class="col-lg-6">' +
                '<div class="form-outline">        ' +
                '<label class="mx-2 font-weight-bold" for="pageSize">{{ "Page size"|trans }}::</label>' +
                '<input class="form-control  mr-sm-2 w-50" type="number" value="10" min="1" id="pageSize"/>' +
                '</div>' +
                '</div>' +
                '<div class="col-lg-6">' +
                '<div class="form-outline">' +
                '<label class="mx-2 font-weight-bold" for="page">{{ "Page"|trans }}:</label>' +
                '<div class="input-group  mr-sm-2 w-50">' +
                '<select class="form-control" id="page" onchange="search();">' +
                '<option value="0" selected="selected">1</option>' +
                '</select>' +
                '<div class="input-group-append">' +
                '<div class="input-group-text" id="pageCount">/ 1</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div> ');
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
