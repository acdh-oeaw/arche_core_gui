jQuery(function ($) {

    "use strict";
    var resObj = {};
    var resId = "";
    /** CTRL PRess check for the tree view  #19924 **/
    var cntrlIsPressed = false;
    const Cite = require('citation-js');
    var expertTable;
    var childTable;
    var versionVisible = false;
    var smartSearchInputField = $('#sm-hero-str');
    var autocompleteTimeout = null;
    var autocompleteCounter = 1;

    $(document).ready(function () {
        addButtonToDescriptionText();
        $('#cite-loader').removeClass('hidden');
        if ($('#resourceHasVersion').val()) {
            versionVisible = true;
        }

        resId = $("#resId").val();
        checkDetailCardEvents();

        loadAdditionalData();
        // hide the summary div if there is no data inside it
        if ($('#av-summary').text().trim().length == 0) {
            $('#ad-summary').hide();
        }
    });

    $(document).keydown(function (event) {
        if (event.which == "17")
            cntrlIsPressed = true;
    });

    $(document).keyup(function () {
        cntrlIsPressed = false;
    });
    /** CTRL PRess check for the tree view   #19924  END **/


    function loadAdditionalData() {
        initExpertView();
        fetchChildTree();
        //fetchChild();
        showCiteBlock();
        if (versionVisible) {
            fetchVersionsBlock();
        }
        fetchBreadcrumb();
        fetchRPR();
        fetchPublications();
        fetchNextPrevItem();
        showTitleImage();
    }
    
    /**
     * Display the titleimage with ajax if we a response 
     * @returns {undefined}
     */
    function showTitleImage() {
        var currentUrl = $(location).attr('href');
        currentUrl = currentUrl.replace('/browser/metadata/', '/api/');
        var imgSrc = 'https://arche-thumbnails.acdh.oeaw.ac.at?id=' + currentUrl  + '&width=600';
        $.ajax({
                url: imgSrc, 
                type: 'GET',
                success: function (data) {
                    $('.titleimage-loader').hide();
                    $('.card.metadata.titleimage').show().html('<center><a href="https://arche-thumbnails.acdh.oeaw.ac.at?id=' + currentUrl  + '&width=600" data-lightbox="detail-titleimage">\n\
                                        <img class="img-fluid" src="https://arche-thumbnails.acdh.oeaw.ac.at?id=' + currentUrl  + '&width=200" >\n\
                                        </a></center>');
                },
                error: function () {
                    $('.titleimage-loader').hide();
                    $('.card.metadata.titleimage').hide();
                    //console.log('Failed to fetch image.');
                }
            });
    }

    /**
     * Truncate the text for the description field
     * @param {type} text
     * @param {type} maxLines
     * @returns {String}
     */
    function truncateText(text, wordCount) {
        return text.split(" ").splice(0, wordCount).join(" ");
    }

    function stripHtml(html) {
        var temporaryDiv = document.createElement("div");
        temporaryDiv.innerHTML = html;
        return temporaryDiv.textContent || temporaryDiv.innerText || "";
    }

    function addButtonToDescriptionText() {
        var longText = $('.descriptionTextShort').html();
        // Select the first 5 lines
        if (longText === undefined) {
            return;
        }
        var truncatedText = truncateText(longText, 150);
        var strippedLongText = stripHtml(longText).trim();
        var strippedTruncatedText = stripHtml(truncatedText).trim();
        if (strippedLongText !== strippedTruncatedText) {
            $('.descriptionTextShort').html(truncatedText + '...' + '<a class="hasdescription-toggle-button" id="descriptionTextShortBtn">' + Drupal.t("Continue reading") + '</a>');
        }
    }

    function redrawTabs() {
        // Check if there is an active tab
        if ($('#arche-detail-tabs li.active').length === 0) {
            console.log("redraw tab");
            // Activate the first visible tab
            var firstVisibleTab = $('#arche-detail-tabs li:visible').first();
            console.log(firstVisibleTab);
            $('#' + firstVisibleTab.attr('id') + ' .nav-link').addClass('active');
            $('#' + firstVisibleTab.attr('id') + '-content').addClass('show active');
            $('#' + firstVisibleTab.attr('id') + ' .nav-link').attr('aria-selected', 'true');
        }
    }

    function hideEmptyTabs(tab) {
        $(tab).addClass('hidden');
        $(tab + '-content').addClass('hidden');

        var tabs = ['#collection-content-tab', '#associated-publications-tab', '#associated-coll-res-tab'];
        var notHiddenTab = "";
        tabs.forEach(function (tabId, index) {
            if (!$(tabId).hasClass('hidden') && notHiddenTab === "") {
                notHiddenTab = tabId;
                return false;
            }
        });

        if (notHiddenTab) {
            $(notHiddenTab + ' a.nav-link').tab('show');
            $(notHiddenTab + '-content').show();
        }
    }

    /// hasDescription button ///
    $(document).delegate("#descriptionTextShortBtn", "click", function (e) {
        $('.descriptionTextShort').hide();
        $('.descriptionTextLong').show();
    });

    $(document).delegate("#descriptionTextLongBtn", "click", function (e) {
        $('.descriptionTextShort').show();
        $('.descriptionTextLong').hide();
    });

    $(document).delegate("a#copyPid", "click", function (e) {
        // Select the input field content
        var text = $('#pidValue').text();
        var tempInput = $("<input>");
        tempInput.val($('#pidValue').text());
        $("body").append(tempInput);
        tempInput.select();
        // Copy the selected text to the clipboard
        document.execCommand('copy');
        tempInput.remove();
        // Display a feedback message (optional)
        alert('Link copied to clipboard!');
        e.preventDefault();
    });

    function fetchNextPrevItem() {
        var acdhid = $('#resId').val();
        var rootId = $('#rootId').val();

        if (rootId) {
            $.ajax({
                url: '/browser/api/nextPrevItem/' + rootId + '/' + acdhid + '/' + drupalSettings.arche_core_gui.gui_lang,
                type: "GET",
                success: function (data, status) {
                    if (data) {
                        if(data.next) {
                            console.log(data.next);
                            $('#next-child-url').html('<a href="/browser/metadata/'+data.next.id+'" id="archeHref" alt="'+data.next.title+'" title="'+data.next.title+'">'+ Drupal.t('Next')+' >>> </a>');
                        }
                        if(data.previous) {
                            console.log(data.previous);
                            $('#previous-child-url').html('<a href="/browser/metadata/'+data.previous.id+'" id="archeHref" alt="'+data.previous.title+'" title="'+data.previous.title+'"> <<< '+ Drupal.t('Previous')+' </a>');
                        }
                        
                    }
                },
                error: function (xhr, status, error) {
                    console.log("next prev item fetch error" + error);
                }
            });
        }
    }

    function fetchBreadcrumb() {
        var acdhid = $('#resId').val();
        $.ajax({
            url: '/browser/api/breadcrumb/' + acdhid + '/' + drupalSettings.arche_core_gui.gui_lang,
            type: "GET",
            success: function (data, status) {
                var currentUrl = window.location.href;
                var textToKeep = "/browser/metadata/";
                var position = currentUrl.indexOf(textToKeep);
                if (position !== -1) {
                    currentUrl = currentUrl.substring(0, position + textToKeep.length);
                }
                // 
                if (data) {
                    var str = "";
                    $.each(data, function (index, value) {
                        str += "<a href='" + currentUrl + value.id + "' title='" + value.placeholder + "'>" + value.title + "</a>";
                        if (index !== data.length - 1) {
                            str += " \\ ";
                        }
                    });
                    $('.metadata-breadcrumb').html(str);
                }
            },
            error: function (xhr, status, error) {
                console.log("breadcrumb error" + error);
            }
        }); //
    }

    function fetchVersionsBlock() {
        //get the data
        var url = $('#resId').val();
        var acdhid = $('#resId').val();
        if (url) {
            $('#versions-tree').jstree({
                'core': {
                    'data': {
                        'url': function (node) {
                            if (node.id !== "#") {
                                acdhid = node.id;
                            }
                            return '/browser/api/versions-list/' + acdhid + '/' + drupalSettings.arche_core_gui.gui_lang;
                        },
                        'data': function (node) {
                            return {'id': node.id};
                        },
                        'success': function (nodes) {
                            if (parseInt(nodes[0].id) !== parseInt(acdhid)) {
                                //show the newer version div
                                $('#metadata-versions-alert').removeClass('hidden-alert');
                                $('#metadata-versions-alert-url').attr("href", '/browser/metadata/' + nodes[0].id);
                            }
                        }
                    },
                    themes: {stripes: true},
                    error: function (jqXHR, textStatus, errorThrown) {
                        $('#versions-tree').html("<h3>Error: </h3><p>" + jqXHR.reason + "</p>");
                    },
                    search: {
                        "ajax": {
                            "url": '/browser/api/versions-list/' + acdhid + '/' + drupalSettings.arche_core_gui.gui_lang,
                            "data": function (str) {
                                return {
                                    "operation": "search",
                                    "q": str
                                };
                            }
                        },
                        case_sensitive: false
                    },
                    plugins: ['search']
                }
            });
            // not ready yet
            $("#search-input").keyup(function () {
                var searchString = $(this).val();
                $('#versions-tree').jstree('search', searchString);
            });
            $('#versions-tree').bind("click.jstree", function (node, data) {
                if (node.originalEvent.target.id) {
                    var node = $('#versions-tree').jstree(true).get_node(node.originalEvent.target.id);
                    if (node.original.uri) {
                        if (cntrlIsPressed)
                        {
                            window.open("/browser/metadata/" + node.original.uri, '_blank');
                        } else {
                            window.location.href = "/browser/metadata/" + node.original.uri;
                        }
                    }
                }
            });
        }
    }

    function fetchChildTree() {
        //get the data
        var url = $('#resId').val();
        if (url) {
            $('#child-tree').jstree({
                'core': {
                    'data': {
                        'url': function (node) {
                            var acdhid = $('#resId').val();
                            if (node.id != "#") {
                                acdhid = node.id;
                            }

                            return '/browser/api/child-tree/' + acdhid + '/' + drupalSettings.arche_core_gui.gui_lang;
                        },
                        'data': function (node) {
                            return {'id': node.id};
                        },
                        'success': function (nodes) {
                            console.log("Success:");
                            console.log(nodes);

                            if (nodes.length === 0) {
                                //$('#collection-content-tab').hide();  // Show message for no data
                                $('#collection-content-tab-content').hide();  // Show message for no data
                                hideEmptyTabs('#collection-content-tab');
                                //redrawTabs();
                            }
                        }
                    },
                    themes: {stripes: true},
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log("error");
                        console.log(jqXHR);
                        console.log(textStatus);
                        console.log(errorThrown);
                        //$('#child-tree').html("<h3>Error: </h3><p>" + jqXHR.reason + "</p>");
                        hideEmptyTabs('#collection-content-tab');
                    },
                    /*
                     search: {
                     "ajax": {
                     "url": '/browser/api/get_collection_data_lazy/' + $('#acdhid').val() + '/' + drupalSettings.arche_core_gui.gui_lang,
                     "data": function (str) {
                     return {
                     "operation": "search",
                     "q": str
                     };
                     }
                     },
                     case_sensitive: false
                     },
                     plugins: ['search']*/
                }
            });
            // not ready yet
            $("#search-input").keyup(function () {
                var searchString = $(this).val();
                $('#child-tree').jstree('search', searchString);
            });

            /*
             $('#child-tree').on('ready.jstree', function () {
             $('<div class="row"><div class="col-12 text-center pt-1"><button id="show-more-child-tree" class="ms-auto btn btn-arche-blue basic">Show More</button></div></div>').insertAfter('.child-elements-div');
             $('#child-tree').css('max-height', '250px');
             $('#child-tree').css('overflow', 'hidden');
             });
             */

            $('#child-tree').bind("click.jstree", function (node, data) {
                if (node.originalEvent.target.id) {
                    var node = $('#child-tree').jstree(true).get_node(node.originalEvent.target.id);
                    if (node.original.uri) {
                        if (cntrlIsPressed)
                        {
                            window.open("/browser/metadata/" + node.original.uri, '_blank');
                        } else {
                            window.location.href = "/browser/metadata/" + node.original.uri;
                        }
                    }
                }
            });
        }
    }
    /*
     $(document).delegate("#show-more-child-tree", "click", function (e) {
     var container = $('#child-tree');
     
     // Check if the container is collapsed or expanded
     if (container.css('max-height') === '250px') {
     // Expand the tree
     container.css('max-height', 'none');
     container.css('overflow', 'auto');
     $(this).text('Show Less');
     } else {
     // Collapse the tree
     container.css('max-height', '250px');
     container.css('overflow', 'hidden');// Reset max-height to 150px (collapse)
     $(this).text('Show More');  // Change button text to "Show More"
     }
     });
     */

    function removeBeforeHash(str) {
        let hashIndex = str.indexOf('#');
        if (hashIndex !== -1) {
            return str.substring(hashIndex + 1);
        } else {
            return str; // Return the original string if no # found
        }
    }


    function fetchPublications() {
        var limit = 10;
        var page = 0;
        var order = 'titledesc';
        var timeout = 10000; // in milliseconds
        var rcrTable = $('.publications-table').DataTable({
            "paging": true,
            "searching": true,
            "pageLength": 10,
            "processing": true,
            "deferRender": true,
            "bInfo": false, // Hide table information
            'language': {
                "processing": "<img src='/browser/themes/contrib/arche-theme-bs/images/arche_logo_flip_47px.gif' />"
            },
            "serverSide": true,
            "serverMethod": "post",
            "ajax": {
                'url': "/browser/api/publicationsDT/" + resId + "/" + drupalSettings.arche_core_gui.gui_lang,
                complete: function (response) {
                    if (response === undefined) {
                        //$('.child-elements-div').hide();
                        hideEmptyTabs('#associated-publications-tab');
                        return;
                    }
                },
                error: function (xhr, status, error) {
                    //$(".loader-versions-div").hide();
                    $('.publications-elements-div').hide();
                    hideEmptyTabs('#associated-publications-tab');
                }
            },
            'columns': [
                {data: 'customCitation', render: function (data, type, row, meta) {
                        return 'Loading...'; // Initial placeholder
                    }
                },
                {data: 'property', render: function (data, type, row, meta) {
                        if (row.property) {
                            return removeBeforeHash(row.property);
                        }
                        return "";
                    }
                },
                {data: 'title', visible: false},
                {data: 'type', visible: false},
                {data: 'acdhid', visible: false}
            ],
            createdRow: function (row, data, dataIndex) {
                // Perform the AJAX request for the URL CS Content field
                var cell = $('td', row).eq(0); // Adjust the index if the order of columns changes

                try {
                    var citationText = data.customCitation;
                    if (!data.customCitation.startsWith('@')) {
                        citationText = "@dataset{" + data.id + ", " + data.customCitation + "}";
                    }

                    let citeDT = new Cite(citationText);
                    let templateName = 'apa-6th';
                    var template = "";
                    url_csl_content("/browser/modules/contrib/arche_core_gui/csl/apa-6th-edition.csl")
                            .done(function (data) {

                                template = data;
                                Cite.CSL.register.addTemplate(templateName, template);
                                var opt = {
                                    format: 'string'
                                };
                                opt.type = 'html';
                                opt.style = 'citation-' + templateName;
                                opt.lang = 'en-US';
                                return citeDT.get(opt);
                            })
                            .then(function (d) {
                                var opt = {
                                    format: 'string'
                                };
                                opt.type = 'html';
                                opt.style = 'citation-' + templateName;
                                opt.lang = 'en-US';
                                cell.html('<a href="/browser/metadata/' + data.id + '">' + citeDT.get(opt) + '</a>');
                            });
                } catch (error) {
                    //console.log(error);
                    cell.html('<a href="/browser/metadata/' + data.id + '">' + data.customCitation + '</a>');
                }
            },
            fnDrawCallback: function () {
            }
        });
    }


    function fetchRPR() {
        var limit = 10;
        var page = 0;
        var order = 'titledesc';
        var timeout = 10000; // in milliseconds
        var rcrTable = $('.rcr-table').DataTable({
            "paging": true,
            "searching": true,
            "pageLength": 10,
            "processing": true,
            "deferRender": true,
            "bInfo": false, // Hide table information
            'language': {
                "processing": "<img src='/browser/themes/contrib/arche-theme-bs/images/arche_logo_flip_47px.gif' />"
            },
            "serverSide": true,
            "serverMethod": "post",
            "ajax": {
                'url': "/browser/api/rprDT/" + resId + "/" + drupalSettings.arche_core_gui.gui_lang,
                complete: function (response) {
                    if (response === undefined) {
                        hideEmptyTabs('#associated-coll-res-tab');
                        //$('.child-elements-div').hide();
                        return;
                    }
                },
                error: function (xhr, status, error) {
                    //$(".loader-versions-div").hide();
                    hideEmptyTabs('#associated-coll-res-tab');
                    $('.rcr-elements-div').hide();
                }
            },
            'columns': [
                {data: 'title', render: function (data, type, row, meta) {
                        return '<a href="' + row.id + '">' + row.title + '</a>';
                        var shortcut = row.type;
                        shortcut = shortcut.replace('https://vocabs.acdh.oeaw.ac.at/schema#', 'acdh:');
                        var title = removeBeforeHash(row.title);
                        var text = '<div class="col-block col-lg-12 child-table-content-div">';
                        //title
                        text += '<div class="res-property">';
                        text += '<h5 class="h5-blue-title"><a href="/browser/metadata/' + row.identifier + '">' + title + '</a></h5></div>';
                        //type
                        text += '<div class="res-property">';
                        text += '<a id="archeHref" href="/browser/search/type=' + shortcut + '&payload=false" class="btn btn-arche-gray">' + shortcut + '</a>';
                        text += '</div>';
                        //avdate

                        text += '</div>';
                        return  text;
                    }
                },
                {data: 'property', render: function (data, type, row, meta) {
                        if (row.property) {
                            return removeBeforeHash(row.property);
                        }
                        return "";
                    }
                },
                {data: 'type', render: function (data, type, row, meta) {
                        if (row.type) {
                            return removeBeforeHash(row.type);
                        }
                        return "";
                    }
                },
                {data: 'acdhid', visible: false}
            ],
            fnDrawCallback: function () {
            }
        });
    }

    function initExpertView() {
        expertTable = $('#expertDT').DataTable({
            "deferRender": true,
            //"dom": '<"top"lfp<"clear">>rt<"bottom"i<"clear">>',
        });
    }

    function reloadDetail(id) {
        $.ajax({
            url: '/browser/metadata_ajax/' + id,
            type: "GET",
            success: function (data, status) {
                $('#meta-content-container').show();
                $('#block-arche-theme-content').html(data);
                var currentUrl = window.location.href;
                var textToKeep = "/browser/metadata/";
                var position = currentUrl.indexOf(textToKeep);
                if (position !== -1) {
                    currentUrl = currentUrl.substring(0, position + textToKeep.length);
                }
                window.history.replaceState({}, '', currentUrl + id);
            },
            error: function (xhr, status, error) {
                $('#block-arche-theme-content').html(error);
            }
        }); 
    }

    //expertDtDiv
    $(document).delegate("#expertViewBtn", "click", function (e) {
        e.preventDefault();
        if ($(this).hasClass('basic')) {
            $('#meta-content-container').hide();
            $('#expertdt-container').fadeIn(200);
            $(this).removeClass('basic');
            $(this).addClass('expert');
            $(this).text(Drupal.t('Basic-View'));
        } else {
            $('#expertdt-container').hide();
            $('#meta-content-container').fadeIn(200);
            $(this).removeClass('expert');
            $(this).addClass('basic');
            $(this).text(Drupal.t('Expert-View'));
        }
    });
    
    $(document).delegate("a#archeHref", "click", function (e) {
        $('#meta-content-container').hide();
        var url = $(this).attr('href');
        if (url && url.indexOf("/browser/metadata/") >= 0 || url && url.indexOf("/browser//metadata/") >= 0) {
            $('html, body').animate({scrollTop: '0px'}, 0);
            var id = url;
            id = id.replace("/browser/metadata/", "");
            id = id.replace("/browser//metadata/", "");
            expertTable.ajax.reload();
            fetchChildTree();
            resId = id;
            //fetchMetadata();
            reloadDetail(id);
            checkDetailCardEvents();
            //loadAdditionalData();
            e.preventDefault();
        } else {
            e.preventDefault();
            window.open(url, '_blank');
            $(".loader-div").hide();
        }
    });
  
    //update the UI elements
  function showUI() {
        showAvailableDate();
        showType();
        //showRightSide();
        showTitle();
        //showCite();
        //showSummary();
        //showChildView();
        //showRPR();
        //showExpertView();
        //showInverseTable();
        //showBreadcrumb();
        $('#meta-content-container').show();
        $('#meta-right-container').show();
        $('.metadata-main-loader').hide();
        $('.metadata-right-loader').hide();
    }

    function showType() {
        if (resObj.getType()) {
            $('#av-rdfType').html(resObj.getType());
        } else {
            $('#ad-rdfType').hide();
        }
    }

    function showTitle() {
        if (resObj.getTitle()) {
            $('#av-hasTitle').html(resObj.getTitle());
        } else {
            $('#ad-hasTitle').hide();
        }
    }

    function showAvailableDate() {
        if (resObj.getAvailableDate()) {
            var text = $('#av-hasAvailableDate').text();
            $('#av-hasAvailableDate').html(text + resObj.getAvailableDate());
        } else {
            $('#ad-hasAvailableDate').hide();
        }
    }

    function checkDetailCardEvents() {
        $(".mdr-card-collapse-btn").click(function () {
            var dataValue = $(this).data('bs-target');
            var targetLink = $('a[data-bs-target="' + dataValue + '"]');
            if (targetLink.html() === '<i class="fa fa-solid fa-chevron-up"></i>') {
                targetLink.html('<i class="fa fa-solid fa-chevron-down"></i>');
            } else {
                targetLink.html('<i class="fa fa-solid fa-chevron-up"></i>');
            }
        });
    }
   
    ///////////// CITE ////////////////////
    /**
     * Generate the cite tab header
     * @param string type
     * @param string first
     * @param string typeid -> id for the handle event
     * @returns string
     */
    function createCiteTab(type, typeid) {
        $('#cite-dropdown').append($('<option></option>').attr('value', typeid.toLowerCase()).text(type.toUpperCase()));
    }

    /**
     * Generate the cite block content
     * @param string data
     * @param string typeid -> id for the handle event
     * @param string first
     * @returns string
     */
    function createCiteContent(data, typeid, first) {
        var selected = 'selected';
        if (!first) {
            selected = 'hidden';
        }

        var html = "<span class='cite-content " + selected + "' id='highlight-" + typeid.toLowerCase() + "'>" + data + "</span>";
        $('#cite-content-figure').append(html);
    }

    /**
     * Show the CITE block
     * @returns {undefined}
     */
    function showCiteBlock() {
        var url = $('#biblaTexUrl').val();
        if (url) {
            //url = "https://arche-biblatex.acdh.oeaw.ac.at/?id=https://arche-dev.acdh-dev.oeaw.ac.at/api/214536&lang=en";
            $.get(url + '&lang=' + drupalSettings.arche_core_gui.gui_lang).done(function (data) {
                $('#cite-div').removeClass('hidden');
                //$('#cite-content-div').addClass('show');
                //$('#cite-content-div').removeClass('hidden');
                $('#cite-loader').addClass('hidden');
                try {
                    let cite = new Cite(data);
                    var apa_loaded = true;
                    let templateName = 'apa-6th';
                    var template = "";
                    url_csl_content("/browser/modules/contrib/arche_core_gui/csl/apa-6th-edition.csl")
                            .done(function (data) {

                                template = data;
                                Cite.CSL.register.addTemplate(templateName, template);
                                var opt = {
                                    format: 'string'
                                };
                                opt.type = 'html';
                                opt.style = 'citation-' + templateName;
                                opt.lang = 'en-US';
                                createCiteTab('apa 6th', 'apa-6th');
                                createCiteContent(cite.get(opt), 'apa-6th', true);
                                apa_loaded = false;
                            }).then(function (d) {

                        //harvard
                        var opt = {
                            format: 'string'
                        };
                        opt.type = 'html';
                        opt.style = 'citation-harvard1';
                        opt.lang = 'en-US';
                        createCiteTab('harvard', 'harvard');
                        createCiteContent(cite.get(opt), 'harvard', apa_loaded);
                        //Vancouver
                        var opt = {
                            format: 'string'
                        };
                        opt.type = 'html';
                        opt.style = 'citation-vancouver';
                        opt.lang = 'en-US';
                        createCiteTab('vancouver', 'vancouver');
                        createCiteContent(cite.get(opt), 'vancouver', false);
                        createCiteTab('BiblaTex', 'biblatex');
                        createCiteContent(data, 'BiblaTex', false);
                    });
                } catch (error) {
                    createCiteErrorResponse(error);
                    return false;
                }

            }).fail(function (xhr) {
                createCiteErrorResponse(Drupal.t("CITE is not available!"));
                return false;
            });
        }
    }

    /**
     * Display Cite error message
     * @param {type} errorText
     * @returns {undefined}
     */
    function createCiteErrorResponse(errorText) {
        $('#cite-div').removeClass('hidden');
        $('#cite-loader').addClass('hidden');
        //stop spinner
        $('#cite-div').html('<div class="alert alert-danger" role="alert">' + Drupal.t(errorText) + '</>');
    }

    function url_csl_content(url) {
        return $.get(url);
    }

    /**
     * Handle the cite content changes on select
     * @param {type} selectedOption
     * @returns {undefined}
     */
    function handleCiteSelectEvents(selectedOption) {
        $('#cite-content-figure span').removeClass('selected').addClass('hidden');
        $('#highlight-' + selectedOption).addClass('selected').removeClass('hidden');
    }

    $('#cite-dropdown').on('change', function (e) {
        e.preventDefault();
        var selectedOption = $(this).val(); // Get the selected option value
        handleCiteSelectEvents(selectedOption);
    });
    $(document).delegate("a#copyCite", "click", function (e) {
        var $tempTextarea = $('<textarea>');
        // Set the textarea value to the content of the div
        $tempTextarea.val($('.csl-entry').text());
        // Append the textarea to the body
        $('body').append($tempTextarea);
        // Select the textarea content
        $tempTextarea.select();
        // Copy the selected content to the clipboard
        document.execCommand('copy');
        // Remove the temporary textarea
        $tempTextarea.remove();
        $('#copy-cite-btn-confirmation').show();
        setTimeout(function () {
            $('#copy-cite-btn-confirmation').hide();
        }, 5000);
        e.preventDefault();
    });



    /***
     * SMART SEARCH START
     */

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
                            var responseObject = $.parseJSON(data);
                            // Initialize autocomplete with the retrieved results
                            smartSearchInputField.autocomplete({source: []});
                            smartSearchInputField.autocomplete({
                                source: responseObject
                            });
                            // Open the autocomplete dropdown
                            smartSearchInputField.autocomplete('search');
                        },
                        error: function (xhr, status, error) {
                            console.error('Error fetching autocomplete data:', error);
                        }
                    });
                }, 300);
            }
        }
    });
});