jQuery(function ($) {

    "use strict";



    $(document).ready(function () {
        console.log("discover JS");
        fetchRoot();
    });


    function fetchRoot() {
        var limit = 10;
        var page = 0;
        var order = 'titledesc';
        var timeout = 10000; // in milliseconds
        console.log("root url: ");
        var rootTable = $('#rootDT').DataTable({
            "paging": true,
            "searching": false,
            "pageLength": 10,
            "processing": true,
            "dom": 'pt',
            //"bInfo": false, // Hide table information
            'language': {
                "processing": "<img src='/browser/themes/contrib/arche-theme-bs/images/arche_logo_flip_47px.gif' />",
                "paginate": {
                    "previous": "&#9668;", // Left arrow icon
                    "next": "&#9658;" // Right arrow icon
                }
            },
            "serverSide": true,
            "serverMethod": "post",
            "ajax": {
                'url': "/browser/api/topcollections-dt/en",
                //'url': "https://arche-dev.acdh-dev.oeaw.ac.at/browser/api/child/214536/en",
                complete: function (response) {
                    if (response === undefined) {
                        console.log('response error');
                        console.log(error);
                        $('.child-elements-div').hide();
                        return;
                    }
                    console.log('response: ');
                    console.log(response.responseJSON);
                },
                error: function (xhr, status, error) {
                    //$(".loader-versions-div").hide();
                    console.log('error');
                    console.log(error);
                    $('.child-elements-div').hide();
                }
            },
            'columns': [
                {data: 'title', render: function (data, type, row, meta) {

                        var text = '<div class="col-block col-lg-12 child-table-content-div">';
                        //title
                        text += '<div class="res-property">';
                        text += '<h5 class="h5-blue-title"><a href="/browser/metadata/' + row.acdhresId + '">' + row.title + '</a></h5></div>';
                        //type
                        text += '<div class="res-property">';
                        text += '<p>' + row.description + '</p>';
                        text += '<p class="btn btn-toolbar-grey btn-toolbar-text no-btn">acdh:TopCollection</p>';
                        text += '<p class="btn btn-toolbar-blue btn-toolbar-text no-btn">' + formatDate(row.avDate) + '</p>';
                        if(row.version) {
                        text += '<p class="btn btn-toolbar-green btn-toolbar-text no-btn">'+row.version+'</p>';
                            
                        }
                        text += '</div>';

                        //avdate

                        text += '</div>';
                        return  text;
                    }


                },
                {data: 'image', width: "20%", render: function (data, type, row, meta) {
                        console.log(row);
                        var acdhid = row.identifier.replace(/^https?:\/\//i, '');
                        return '<div class="dt-single-res-thumb text-center" style="min-width: 120px;">\n\
                            <center><a href="https://arche-thumbnails.acdh.oeaw.ac.at/' + acdhid + '?width=600" data-lightbox="detail-titleimage-' + row.acdhresId + '">\n\
                                <img class="img-fluid bg-white" src="https://arche-thumbnails.acdh.oeaw.ac.at/' + acdhid + '?width=300">\n\
                            </a></center>\n\
                            </div>';
                    }
                },
                {data: 'avDate', visible: false},
                {data: 'description', visible: false},
                {data: 'identifier', visible: false},
                {data: 'modifyDate', visible: false}
            ],
            fnDrawCallback: function () {
                $("#rootDT thead").remove();
            }
        });

        $('.dataTables_paginate').appendTo('.dataTables_wrapper .dataTables_filter');
        /*
         $("#sortBy").change(function () {
         var colIdx = $('#sortBy :selected').val();
         let id = colIdx.substring(0, 1);
         let order = colIdx.substring(2, 3);
         orderVal = 'asc';
         if (order > 0) {
         orderVal = 'desc';
         }
         
         childTable.order([id, orderVal]).draw();
         });*/
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