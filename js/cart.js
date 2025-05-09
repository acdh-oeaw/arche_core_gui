jQuery(function ($) {
    $.noConflict();
    "use strict";

    $(document).ready(function () {
        updateCartHeader();
        displayCartTable();
    });


    function updateCartHeader() {
        const rawCart = window.getCookieByName('cart_items');
        const cart = rawCart ? JSON.parse(rawCart) : {};
        const cartCount = Object.keys(cart).length;
        if (cartCount > 0) {
            $('#cart-items-header-menu').html('(' + cartCount + ')');
        }
    }

    function displayCartTable() {

        const rawCart = window.getCookieByName('cart_items');
        const cart = rawCart ? JSON.parse(rawCart) : {};

        const cartArray = Object.entries(cart).map(([id, item]) => ({
                id,
                title: item.title,
                accessres: item.accessres,
                type: item.type,
                size: 0
            }));

        console.log("display: ");
        console.log(cartArray);

        $('#cartTable').DataTable({
             columnDefs: [
                {targets: [0], orderable: false}  // Disable ordering on columns 0 and 2
            ],
            data: cartArray,
            columns: [
                {data: 'downloadAll', title: '<input type="checkbox" id="check_all_cart_items">', render: function (data, type, row, meta) {
                        return '<a href="' + row.id + '">' + row.id + '</a>';
                    }
                },
                {data: 'title'},
                {data: 'size'},
                {data: 'accessres'},
                 {data: 'type'},
                {data: 'status', title: Drupal.t('Status'), render: function (data, type, row, meta) {
                        return 'status text';
                    }
                },
                {data: 'download', title: Drupal.t('Download'), render: function (data, type, row, meta) {
                        return '<a href="#" id="download-cart-element" class="btn btn-arche-green" data-id="'+row.id+'">'+ Drupal.t("Download")+'</a> ';
                    }
                },
                {data: 'delete', title: Drupal.t('Delete'), render: function (data, type, row, meta) {
                        return '<a href="#" id="delete-cart-element" class="btn btn-arche-red" data-id="'+row.id+'">'+ Drupal.t("Delete")+'</a> ';
                    }
                }
                
            ],
        });
/*
        var table = new DataTable('#cartTable', {
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
                processing: "<img src='/browser/themes/contrib/arche-theme-bs/images/arche_logo_flip_47px.gif' />",
                url: datatableLanguage
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
        });*/
    }



    $(document).delegate("#add-resource-cart", "click", function (e) {
        e.preventDefault();
        console.log("clicked");
        var resId = $('#resId').val();
        var title = $('#resource-main-title').val();
        var accessRes = $('#resource-access').val();
        var type = $('#resource-type').val();
        var resource = {title: title, accessres: accessRes, type: type};
        window.addCartItem(resId, resource);

        const rawCart = window.getCookieByName('cart_items');
        const cart = rawCart ? JSON.parse(rawCart) : {};
        // update the header
        const cartCount = Object.keys(cart).length;
        console.log(cartCount);
        if (cartCount > 0) {
            $('#cart-items-header-menu').html('(' + cartCount + ')');
        }
    });


});