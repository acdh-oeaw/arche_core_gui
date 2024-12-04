jQuery(function ($) {
    $.noConflict();
    "use strict";
    
    
    window.expertTable;
    window.rprTable;
    window.publicationsTable;
    window.involvedTable;
    window.hasMemberTable;
    window.collectionConceptTable;
    window.contributedTable;
    window.spatialTable;
    window.relatedTable;
    window.isPartOfTable;

    window.fetchIsPartOf = function (resId) {
        $('.loading-indicator.loading-indicator-ispartof').removeClass('d-none');

        window.isPartOfTable = new DataTable('#isPartOfDT', {
            paging: true,
            searching: true,
            searchDelay: 500,
            lengthChange: false,
            pageLength: 10,
            processing: true,
            deferRender: true,
            columnDefs: [
                {targets: [2], orderable: false}  // Disable ordering on columns 0 and 2
            ],
            bInfo: false, // Hide table information
            language: {
                processing: "<img src='/browser/themes/contrib/arche-theme-bs/images/arche_logo_flip_47px.gif' />"
            },
            serverSide: true,
            serverMethod: "post",
            ajax: {
                url: "/browser/api/isPartOfDT/" + resId + "/" + drupalSettings.arche_core_gui.gui_lang,
                timeout: 10000,
                complete: function (response) {
                    $('.loading-indicator.loading-indicator-ispartof').addClass('d-none');
                    $('.row.ispartof-table-div').removeClass('d-none');
                    if (response === undefined) {
                        $('.row.ispartof-table-div').hide();
                        return;
                    }
                },
                error: function (xhr, status, error) {
                    console.log("ERROR" + error);
                    $('.row.ispartof-table-div').hide();
                    $('.loading-indicator.loading-indicator-ispartof').addClass('d-none');
                }
            },
            columns: [
                {data: 'acdhid', visible: false},
                {data: 'id', visible: false},

                {data: 'property', visible: false},
                {data: 'title', title: Drupal.t('Entity'), render: function (data, type, row, meta) {
                        return '<a href="' + row.acdhid + '">' + row.title + '</a>';
                    }
                },
                {data: 'type', visible: false}
            ],
            fnDrawCallback: function () {
            }
        });
    }

    //conceptscheme view DT
    window.fetchCollectionConceptTable = function (resId) {
        $('.loading-indicator').removeClass('d-none');
        //relatedTable = new DataTable('#relatedDT', {
        window.collectionConceptTable = $('#collectionConceptDT').DataTable({
            paging: true,
            searching: true,
            searchDelay: 500,
            lengthChange: false,
            pageLength: 10,
            processing: true,
            deferRender: true,
            columnDefs: [
                {targets: [2], orderable: false}  // Disable ordering on columns 0 and 2
            ],
            bInfo: false, // Hide table information
            language: {
                processing: "<img src='/browser/themes/contrib/arche-theme-bs/images/arche_logo_flip_47px.gif' />"
            },
            serverSide: true,
            serverMethod: "post",
            ajax: {
                url: "/browser/api/collectionConceptDT/" + resId + "/" + drupalSettings.arche_core_gui.gui_lang,
                timeout: 10000,
                complete: function (response) {
                    $('.loading-indicator').addClass('d-none');
                    $('.row.collection-concept-table-div').removeClass('d-none');
                    if (response === undefined) {
                        $('.row.collection-concept-table-div').hide();
                        return;
                    }
                },
                error: function (xhr, status, error) {
                    console.log("ERROR" + error);
                    $('.row.collection-concept-table-div').hide();
                    $('.loading-indicator').addClass('d-none');
                }
            },
            columns: [
                {data: 'acdhid', visible: false},
                {data: 'id', visible: false},

                {data: 'property', visible: false},
                {data: 'title', title: Drupal.t('Entity'), render: function (data, type, row, meta) {
                        return '<a href="' + row.acdhid + '">' + row.title + '</a>';
                    }
                },
                {data: 'type', visible: false}
            ],
            fnDrawCallback: function () {
            }
        });
    }

    // organisations view DT
    window.fetchOrganisationInvolvedTable = function (resId) {
        $('.loading-indicator').removeClass('d-none');
        //relatedTable = new DataTable('#relatedDT', {
        window.involvedTable = $('#involvedDT').DataTable({
            paging: true,
            searching: true,
            searchDelay: 500,
            lengthChange: false,
            pageLength: 10,
            processing: true,
            deferRender: true,
            columnDefs: [
                {targets: [2], orderable: false}  // Disable ordering on columns 0 and 2
            ],
            bInfo: false, // Hide table information
            language: {
                processing: "<img src='/browser/themes/contrib/arche-theme-bs/images/arche_logo_flip_47px.gif' />"
            },
            serverSide: true,
            serverMethod: "post",
            ajax: {
                url: "/browser/api/involvedDT/" + resId + "/" + drupalSettings.arche_core_gui.gui_lang,
                timeout: 10000,
                complete: function (response) {
                    $('.loading-indicator').addClass('d-none');
                    $('.row.involved-table-div').removeClass('d-none');
                    if (response === undefined) {
                        $('.row.involved-table-div').hide();
                        return;
                    }
                },
                error: function (xhr, status, error) {
                    console.log("ERROR" + error);
                    $('.row.involved-table-div').hide();
                    $('.loading-indicator').addClass('d-none');
                }
            },
            columns: [
                {data: 'acdhid', visible: false},
                {data: 'id', visible: false},

                {data: 'property', title: Drupal.t('Role'), render: function (data, type, row, meta) {
                        if (row.property) {
                            return removeBeforeHash(row.property);
                        }
                        return "";
                    }
                },
                {data: 'title', title: Drupal.t('Entity'), render: function (data, type, row, meta) {
                        return '<a href="' + row.acdhid + '">' + row.title + '</a>';
                    }
                },
                {data: 'type', title: Drupal.t('Type'), render: function (data, type, row, meta) {
                        if (row.type) {
                            return removeBeforeHash(row.type);
                        }
                        return "";
                    }
                },
            ],
            fnDrawCallback: function () {
            }
        });
    }

    window.fetchOrganisationHasMembersTable = function (resId) {
        //relatedTable = new DataTable('#relatedDT', {
        window.hasMemberTable = $('#hasMembersDT').DataTable({
            paging: true,
            searching: true,
            searchDelay: 500,
            lengthChange: false,
            pageLength: 10,
            processing: true,
            deferRender: true,
            columnDefs: [
                {targets: [2], orderable: false}  // Disable ordering on columns 0 and 2
            ],
            bInfo: false, // Hide table information
            language: {
                processing: "<img src='/browser/themes/contrib/arche-theme-bs/images/arche_logo_flip_47px.gif' />"
            },
            serverSide: true,
            serverMethod: "post",
            ajax: {
                url: "/browser/api/hasMembersDT/" + resId + "/" + drupalSettings.arche_core_gui.gui_lang,
                timeout: 10000,
                complete: function (response) {
                    $('.row.hasmembers-table-div').removeClass('d-none');
                    if (response === undefined) {
                        $('.row.hasmembers-table-div').hide();
                        return;
                    }
                },
                error: function (xhr, status, error) {
                    console.log("ERROR" + error);
                    $('.row.hasmembers-table-div').hide();
                }
            },
            columns: [
                {data: 'title', title: Drupal.t('Name'), render: function (data, type, row, meta) {
                        return '<a href="' + row.acdhid + '">' + row.title + '</a>';
                    }
                },
                {data: 'acdhid', visible: false},
                {data: 'id', visible: false},
                {data: 'type', visible: false},
                {data: 'property', visible: false}
            ],
            fnDrawCallback: function () {
            }
        });
    }

    window.fetchPersonContributedTable = function (resId) {
        $('.loading-indicator').removeClass('d-none');
        //relatedTable = new DataTable('#relatedDT', {
        window.contributedTable = $('#contributedDT').DataTable({
            paging: true,
            searching: true,
            lengthChange: false,
            pageLength: 10,
            processing: true,
            deferRender: true,
            columnDefs: [
                {targets: [2], orderable: false}  // Disable ordering on columns 0 and 2
            ],
            bInfo: false, // Hide table information
            'language': {
                processing: "<img src='/browser/themes/contrib/arche-theme-bs/images/arche_logo_flip_47px.gif' />"
            },
            serverSide: true,
            serverMethod: "post",
            ajax: {
                url: "/browser/api/contributedDT/" + resId + "/" + drupalSettings.arche_core_gui.gui_lang,
                timeout: 10000,
                complete: function (response) {
                    $('.loading-indicator').addClass('d-none');
                    $('.row.contributed-table-div').removeClass('d-none');
                    if (response === undefined) {
                        $('.row.contributed-table-div').hide();
                        return;
                    }
                },
                error: function (xhr, status, error) {
                    $('.loading-indicator').addClass('d-none');
                    console.log(xhr);
                    console.log(status);
                    console.log(error);
                    $('.row.contributed-table-div').hide();
                }
            },
            columns: [
                {data: 'acdhid', visible: false},
                {data: 'id', visible: false},
                {data: 'property', title: Drupal.t('Role'), render: function (data, type, row, meta) {
                        if (row.property) {
                            return removeBeforeHash(row.property);
                        }
                        return "";
                    }
                },
                {data: 'title', title: Drupal.t('Entity'), render: function (data, type, row, meta) {
                        return '<a href="' + row.acdhid + '">' + row.title + '</a>';
                    }
                },
                {data: 'type', title: Drupal.t('Type'), render: function (data, type, row, meta) {
                        if (row.type) {
                            return removeBeforeHash(row.type);
                        }
                        return "";
                    }
                }
            ],
            fnDrawCallback: function () {
            }
        });
    }

    window.fetchPlaceSpatialTable = function (resId) {
        $('.loading-indicator').removeClass('d-none');
        //relatedTable = new DataTable('#relatedDT', {
        window.spatialTable = $('#spatialDT').DataTable({
            paging: true,
            searching: true,
            lengthChange: false,
            pageLength: 10,
            processing: true,
            deferRender: true,
            searchDelay: 500, // Optional: Add a delay for user typing
            bInfo: false, // Hide table information
            'language': {
                processing: "<img src='/browser/themes/contrib/arche-theme-bs/images/arche_logo_flip_47px.gif' />"
            },
            serverSide: true,
            serverMethod: "post",
            ajax: {
                url: "/browser/api/spatialDT/" + resId + "/" + drupalSettings.arche_core_gui.gui_lang,
                timeout: 10000,
                complete: function (response) {
                    $('.loading-indicator').addClass('d-none');
                    $('.row.spatial-table-div').removeClass('d-none');
                    if (response === undefined) {
                        $('.row.spatial-table-div').hide();
                        return;
                    }
                },
                error: function (xhr, status, error) {
                    $('.loading-indicator').addClass('d-none');
                    console.log(xhr);
                    console.log(status);
                    console.log(error);
                    $('.row.spatial-table-div').hide();
                }
            },
            columns: [
                {data: 'acdhid', visible: false},
                {data: 'id', visible: false},
                {data: 'property', visible: false},
                {data: 'title', title: Drupal.t('Title'), render: function (data, type, row, meta) {
                        return '<a href="' + row.acdhid + '">' + row.title + '</a>';
                    }
                },
                {data: 'type', title: Drupal.t('Type'), render: function (data, type, row, meta) {
                        if (row.type) {
                            return removeBeforeHash(row.type);
                        }
                        return "";
                    }
                }
            ],
            fnDrawCallback: function () {
            }
        });
    }
    
    window.fetchProjectAssociatedTable = function (resId) {
        $('.loading-indicator').removeClass('d-none');
        //relatedTable = new DataTable('#relatedDT', {
        window.spatialTable = $('#projectAssociatedDT').DataTable({
            paging: true,
            searching: true,
            lengthChange: false,
            pageLength: 10,
            processing: true,
            deferRender: true,
            searchDelay: 500, // Optional: Add a delay for user typing
            bInfo: false, // Hide table information
            'language': {
                processing: "<img src='/browser/themes/contrib/arche-theme-bs/images/arche_logo_flip_47px.gif' />"
            },
            serverSide: true,
            serverMethod: "post",
            ajax: {
                url: "/browser/api/projectAssociatedDT/" + resId + "/" + drupalSettings.arche_core_gui.gui_lang,
                timeout: 10000,
                complete: function (response) {
                    $('.loading-indicator').addClass('d-none');
                    $('.row.spatial-table-div').removeClass('d-none');
                    if (response === undefined) {
                        $('.row.spatial-table-div').hide();
                        return;
                    }
                },
                error: function (xhr, status, error) {
                    $('.loading-indicator').addClass('d-none');
                    console.log(xhr);
                    console.log(status);
                    console.log(error);
                    $('.row.spatial-table-div').hide();
                }
            },
            columns: [
                {data: 'acdhid', visible: false},
                {data: 'id', visible: false},
                {data: 'property', visible: false},
                {data: 'title', title: Drupal.t('Title'), render: function (data, type, row, meta) {
                        return '<a href="' + row.acdhid + '">' + row.title + '</a>';
                    }
                },
                {data: 'type', title: Drupal.t('Type'), render: function (data, type, row, meta) {
                        if (row.type) {
                            return removeBeforeHash(row.type);
                        }
                        return "";
                    }
                }
            ],
            fnDrawCallback: function () {
            }
        });
    }

    window.fetchPublicationsRelatedResourcesTable = function (resId) {
        $('.loading-indicator').removeClass('d-none');
        window.relatedTable = new DataTable('#relatedDT', {
            paging: true,
            searching: true,
            searchDelay: 500,
            pageLength: 10,
            processing: true,
            deferRender: true,
            columnDefs: [
                {targets: [2], orderable: false}  // Disable ordering on columns 0 and 2
            ],
            bInfo: false, // Hide table information
            'language': {
                processing: "<img src='/browser/themes/contrib/arche-theme-bs/images/arche_logo_flip_47px.gif' />"
            },
            serverSide: true,
            serverMethod: "post",
            ajax: {
                url: "/browser/api/relatedDT/" + resId + "/" + drupalSettings.arche_core_gui.gui_lang,
                timeout: 10000,
                complete: function (response) {
                    $('.loading-indicator').addClass('d-none');
                    if (response === undefined) {
                        $('.related-div').hide();
                        return;
                    }
                },
                error: function (xhr, status, error) {
                    $('.loading-indicator').addClass('d-none');
                    $('.related-div').hide();
                }
            },
            columns: [
                {data: 'title', render: function (data, type, row, meta) {
                        return '<a href="' + row.id + '">' + row.title + '</a>';
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


    /**
     * Fetch thepublications for collection, topcollection, resources
     * @returns {undefined}
     */
    window.fetchPublications = function (resId) {
        return window.publicationsTable = new DataTable('#publicationsDT', {
            paging: true,
            destroy: true,
            searching: true,
            pageLength: 10,
            processing: true,
            deferRender: true,
            bInfo: false, // Hide table information
            language: {
                processing: "<img src='/browser/themes/contrib/arche-theme-bs/images/arche_logo_flip_47px.gif' />"
            },
            serverSide: true,
            serverMethod: "post",
            ajax: {
                url: "/browser/api/publicationsDT/" + resId + "/" + drupalSettings.arche_core_gui.gui_lang,
                timeout: 10000,
                complete: function (response) {
                    if (response === undefined) {
                        console.log("fetchPublications undefined");
                        //$('.child-elements-div').hide();
                        /*
                        $('#associated-publications-tab').addClass('hidden');
                        $('#associated-publications-tab-content').addClass('hidden');
                        $('#associated-publications-tab').removeClass('active');
                        $('#associated-publications-tab-content').removeClass('active');*/
                         //window.hideEmptyTabs();
                         
                    }
                },
                error: function (xhr, status, error) {
                    console.log("fetchPublications error");
                    //$(".loader-versions-div").hide();
                    /*
                    $('#associated-publications-tab').addClass('hidden');
                    $('#associated-publications-tab-content').addClass('hidden');
                    $('#associated-publications-tab').removeClass('active');
                    $('#associated-publications-tab-content').removeClass('active');
                    $('.publications-elements-div').hide();*/
                    
                    
                }
            },
            columns: [
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

                    let citeDT = new window.Cite(citationText);
                    let templateName = 'apa-6th';
                    var template = "";
                    window.url_csl_content("/browser/modules/contrib/arche_core_gui/csl/apa-6th-edition.csl")
                            .done(function (data) {

                                template = data;
                                window.Cite.CSL.register.addTemplate(templateName, template);
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
                    cell.html('<a href="/browser/metadata/' + data.id + '">' + data.title + '</a>');
                }
            },
            fnDrawCallback: function () {
            }
        });
    }

    /**
     * Fetch the related resources publications for collection, topcoll. resources.
     * @returns {undefined}
     */
    window.fetchRPR = function (resId, displayedView = 'tabView') {
        if (displayedView == 'projectView') {
            $('.loading-indicator').removeClass('d-none');
        }

        return window.rprTable = new DataTable('#rcrDT', {
            destroy: true,
            paging: true,
            searching: true,
            pageLength: 10,
            processing: true,
            deferRender: true,
            bInfo: false, // Hide table information
            language: {
                processing: "<img src='/browser/themes/contrib/arche-theme-bs/images/arche_logo_flip_47px.gif' />"
            },
            serverSide: true,
            serverMethod: "post",
            ajax: {
                url: "/browser/api/rprDT/" + resId + "/" + drupalSettings.arche_core_gui.gui_lang,
                timeout: 10000,
                complete: function (response) {
                    if (response === undefined) {
                        if (displayedView == 'projectView') {
                            $('.associated-project-table-div').addClass('d-none');
                            $('.loading-indicator').addClass('d-none');
                        } else {
                            console.log("fetchRPR undefined");
                            /*
                            $('#associated-coll-res-tab').addClass('hidden');
                            $('#associated-coll-res-tab-content').addClass('hidden');
                            $('#associated-coll-res-tab').removeClass('active');
                            $('#associated-coll-res-tab-content').removeClass('active');*/
                             //window.hideEmptyTabs();
                        }

                        //$('.child-elements-div').hide();
                        return;
                    }

                    if (displayedView == 'projectView') {
                        $('.associated-project-table-div').removeClass('d-none');
                        $('.loading-indicator').addClass('d-none');
                    }
                },
                error: function (xhr, status, error) {
                    //$(".loader-versions-div").hide();
                    if (displayedView == 'projectView') {
                        $('.associated-project-table-div').addClass('d-none');
                    } else {
                        console.log("fetchRPR error");
                        /*
                        $('#associated-coll-res-tab').addClass('hidden');
                        $('#associated-coll-res-tab-content').addClass('hidden');
                        $('#associated-coll-res-tab').removeClass('active');
                        $('#associated-coll-res-tab-content').removeClass('active');
                        $('.rcr-elements-div').hide();*/
                         //window.hideEmptyTabs();
                    }
                }
            },
            columns: [
                {data: 'title', render: function (data, type, row, meta) {
                        return '<a href="' + row.id + '">' + row.title + '</a>';
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

    window.initExpertView = function () {
        window.expertTable = $('#expertDT').DataTable({
            deferRender: true
                    //"dom": '<"top"lfp<"clear">>rt<"bottom"i<"clear">>',
        });
    }
    
    function removeBeforeHash(str) {
        let hashIndex = str.indexOf('#');
        if (hashIndex !== -1) {
            return str.substring(hashIndex + 1);
        } else {
            return str; // Return the original string if no # found
        }
    }
    
});