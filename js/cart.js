jQuery(function ($) {
    $.noConflict();
    "use strict";

    var cartTable;

    $(document).ready(function () {
        updateCartHeader();
        displayCartTable();
    });

    function reloadCartTable() {
        const rawCart = window.getCookieByName('cart_items');
        const cart = rawCart ? JSON.parse(rawCart) : {};

        const cartArray = Object.entries(cart).map(([id, item]) => ({
                id,
                title: item.title,
                accessres: item.accessres,
                type: item.type,
                size: item.size
            }));

        cartTable.clear().rows.add(cartArray).draw();
    }

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
                size: item.size
            }));


        cartTable = $('#cartTable').DataTable({
            columnDefs: [
                {targets: [0], orderable: false}  // Disable ordering on columns 0 and 2
            ],
            data: cartArray,
            columns: [
                {data: 'downloadAll', title: '<input type="checkbox" id="check_all_cart_items">', render: function (data, type, row, meta) {
                        return '<input type="checkbox" class="check_cart_item" data-id="' + row.id + '" value="' + row.id + '" >';
                    }
                },
                {data: 'title', title: Drupal.t('Title'), render: function (data, type, row, meta) {
                        return '<a href="/browser/metadata/'+row.id+'" target="_blank">' + row.title + '</a> ';
                    }
                },
                {data: 'size', title: Drupal.t('Size'), render: function (data, type, row, meta) {
                        return formatBytes(data);
                    }
                },
                {data: 'accessres'},
                {data: 'type'},
                {data: 'status', title: Drupal.t('Status'), render: function (data, type, row, meta) {
                        return '<div class="downloadStatus dlres-' + row.id + '"></div>';
                    }
                },
                {data: 'download', title: Drupal.t('Download'), render: function (data, type, row, meta) {
                        return '<a href="#" id="" class="btn btn-arche-green download-cart-element" data-id="' + row.id + '">' + Drupal.t("Download") + '</a> ';
                    }
                },
                {data: 'delete', title: Drupal.t('Delete'), render: function (data, type, row, meta) {
                        return '<a href="#" id="" class="btn btn-arche-red delete-cart-element" data-id="' + row.id + '">' + Drupal.t("Delete") + '</a> ';
                    }
                }

            ],
        });
    }

    function startDownloadAndTrack(url, id) {
        $('.downloadStatus.dlres-' + id).text('Downloading...');

        // Start download
        $('#downloadFrame').attr('src', url);

        // Optionally detect when the iframe has finished loading
        $('#downloadFrame').on('load', function () {
            $('.downloadStatus.dlres-' + id).text('Download ready.');
        });
    }


    // Handle select-all checkbox
    $(document).delegate("#check_all_cart_items", "change", function (e) {
        e.preventDefault();
        const checked = this.checked;
        $('#cartTable').find('.check_cart_item').prop('checked', checked);
    });

    $('#cartTable').on('change', '.check_cart_item', function () {
        console.log("checked 2");
        const allChecked = $('.check_cart_item').length === $('.check_cart_item:checked').length;
        $('#check_all_items').prop('checked', allChecked);
    });

    $(document).delegate(".download-cart-element", "click", function (e) {
        e.preventDefault();
        var id = $(this).data('id');
        var baseApi = drupalSettings.arche_core_gui.apiUrl;
        // if the user is not logged in
        //&skipUnauthorized=true
        var resourceUrl = baseApi + 'download?ids[]='+id+'&skipUnauthorized=true';
        console.log(drupalSettings.arche_core_gui);
        console.log(resourceUrl);
        startDownloadAndTrack(resourceUrl, id);

    });

    $(document).delegate(".delete-cart-element", "click", function (e) {
        e.preventDefault();
        var id = $(this).data('id');
        console.log(id);
        window.removeCartItem(id);
        reloadCartTable();

    });

    $(document).delegate("#add-resource-cart", "click", function (e) {
        e.preventDefault();

        var resId = $('#resId').val();
        var title = $('#resource-main-title').val();
        var accessRes = $('#resource-access').val();
        var type = $('#resource-type').val();
        var size = $('#binary-size').val() ? $('#binary-size').val() : "0";
        var resource = {title: title, accessres: accessRes, type: type, size: size};
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

    function formatBytes(bytes) {
        if (bytes >= 1073741824) {
            return (bytes / 1073741824).toFixed(2) + ' GB';
        } else if (bytes >= 1048576) {
            return (bytes / 1048576).toFixed(2) + ' MB';
        } else if (bytes >= 1024) {
            return (bytes / 1024).toFixed(2) + ' KB';
        } else {
            return bytes + ' B';
        }
    }


});