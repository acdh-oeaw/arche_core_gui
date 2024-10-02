jQuery(function ($) {

    var mapPins = null;

    /**
     * Display the smartsearch results
     * @param {type} data
     * @param {type} param
     * @param {type} t0
     * @param {type} initial
     * @returns {undefined}
     */
    window.showResults = function (data, param, t0, initial = false) {
        //function showResults(data, param, t0, initial = false) {
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

        window.createPager(totalPages);
        $('div.dateValues').text('');
        $('input.facet-min').attr('placeholder', '');
        $('input.facet-max').attr('placeholder', '');
        var results = '';
        //we have some results already or empty search
        if ((data.totalCount > 0) || data.totalCount === -1) {
            createFacetCards(data, param);   
        }

        if(data.results) {
            results += displaySearchResult(data.results);
            $('.main-content-row').html(results);
            //if the user selected a value from the map then we have to display it.
            window.displayMapSelectedValue();
        }
        
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
            window.displaySearchWarningMessage(data.messages, data.class);
        }
        
        if (window.bboxObj !== undefined) {
            if (window.bboxObj.drawnItems) {
                setMapLabel(window.bboxObj.drawnItems);
            }
        }

        if (window.bbox !== undefined) {
            setMapLabel(window.bbox);
        }
        
        if(param.searchIn[0]) {
            console.log("display searchin");
            console.log(param.searchIn[0]);
            window.searchInAdd(param.searchIn[0], $(this).data('resource-title'));
            $('#searchIn').show();
        }
        
        $(".discover-left input, .discover-left textarea, .discover-left select, .discover-left button").prop("disabled", false);
        window.updateUrl(param);
        
        fetchSearchToolTips();
        
    }

    function createFacetCards(data, param) {
        var multipleSelects = [];
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
     * Show the facets boxes on the left menu
     * @param {type} fd
     * @param {type} select
     * @returns {String}
     */
    window.createFacetSelectCard = function (fd, select) {
        //function createFacetSelectCard(fd, select) {
        var text = "";
        var idStr = fd.label.replace(/[^\w\s]/gi, '');
        var formattedProperty = fd.property.replace('https://vocabs.acdh.oeaw.ac.at/schema#', '');
        
        var tooltip = "";
        if (typeof fd?.tooltip?.[drupalSettings.arche_core_gui.gui_lang] !== 'undefined') {
            tooltip = fd.tooltip[drupalSettings.arche_core_gui.gui_lang];
        }
        
        idStr = idStr.replace(/\s+/g, '_');
        text += '<div class="card metadata facets">' +
                '<div class="card-header">' +
                '<div class="row justify-content-center align-items-center">' +
                '<div class="col-8"><h6 class="mb-0 pb-0">' + fd.label + '</h6></div>' +
                '<div class="col-2">' +
                '<img src="/browser/themes/contrib/arche-theme-bs/images/common/tooltip_icon.png" class="tooltip-icon-cards '+formattedProperty+' "\n\
                    data-bs-toggle="tooltip" data-bs-placement="top" alt="'+tooltip+'" title="'+tooltip+'"\n\
                    data-bs-trigger="hover focus click" >' +
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
                results += '<h5 class="h5-blue-title"><button type="button" class="btn btn-sm-add searchInBtn" data-resource-id="' + result.id + '" data-resource-title="' + getLangValue(result.title, preferredLang) + '" >+</button><a href="' + archeBaseUrl + '/browser/metadata/' + result.id + '" taget="_blank">' + getLangValue(result.title, preferredLang) + '</a></h5>';
                //results += '<h5 class="h5-blue-title"><a href="' + window.archeBaseUrl + '/browser/metadata/' + result.id + '" taget="_blank">' + window.getLangValue(result.title, window.preferredLang) + '</a></h5>';
                results += '</div>';

                //description
                if (result.description) {
                    results += '<div class="res-property sm-description">';
                    results += window.getLangValue(result.description, window.preferredLang);
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

                results += getParents(result.parent || false, true, window.preferredLang);

                results += '</div>';
                results += '<div class="res-property discover-content-toolbar">';

                results += '<p class="btn-toolbar-gray btn-toolbar-text no-btn">' + shorten(result.class[0]) + '</p>';

                if (result.accessRestriction) {
                    results += window.setAccessRestrictionLabel(result.accessRestriction[0].title['en']);
                    results += result.accessRestriction[0].title[window.preferredLang].replace(/\n/g, ' / ');
                    results += '</p>';
                }

                if (result.accessRestrictionSummary) {
                    results += window.setAccessRestrictionLabel(result.accessRestrictionSummary['en']);
                    results += result.accessRestrictionSummary[window.preferredLang].replace(/\n/g, ' / ');
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
                window.checkThumbnailImage(resourceUrl);
                results += '</div>';
            }
        });
        return results;
    }

    function getParents(parent, top, preferredLang) {
        if (parent === false) {
            return '';
        }
        parent = parent[0];
        var ret = getParents(parent.parent || false, false, preferredLang);
        ret += (ret !== '' ? ' &gt; ' : '') + '<a href="' + window.archeBaseUrl + '/browser/metadata/' + parent.id + '">' + window.getLangValue(parent.title) + '</a>';
        if (top) {
            ret = 'In: ' + ret + '<br/>';
        }
        return ret;
    }
    
    
    function fetchSearchToolTips(){
        console.log("fetchSearchToolTips");
    }
});