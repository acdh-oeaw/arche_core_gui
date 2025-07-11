jQuery(function ($) {
    $.noConflict();
    "use strict";

    var cartTable;

    $(document).ready(function () {
        //window.deleteCartCookie(); 
        updateCartCookie();
        updateCartHeader();
    });

    function reloadCartTable() {

        $.ajax({
            url: "/browser/api/cartDT",
            type: "GET",
            timeout: 10000,
            success: function (data) {
                window.setCartCookieJson(data.cart_items);
                window.setCartCookieOrderedJson(data.cart_items_ordered);
                const rawCart = window.getCookieByName('cart_items_ordered');
                const cart = rawCart ? JSON.parse(rawCart) : {};

                const cartArray = Object.entries(cart).map(([id, item]) => ({
                        id,
                        title: item.title,
                        accessres: item.accessres,
                        type: item.type,
                        size: item.size
                    }));

                cartTable.clear().rows.add(cartArray).draw();
            },
            error: function () {
                console.log("error cart cookie update");

            }
        });


    }

    function updateCartHeader() {

        const rawCart = window.getCookieByName('cart_items');
        const cart = JSON.parse(rawCart) ??  {};
        const cartCount = Object.keys(cart).length;
        if (cartCount > 0) {
            $('#cart-items-header-menu').html('(' + cartCount + ')');
        }
    }



    function updateCartCookie() {
        $.ajax({
            url: "/browser/api/cartDT",
            type: "GET",
            timeout: 10000,
            success: function (data) {
                window.setCartCookieJson(data.cart_items);
                window.setCartCookieOrderedJson(data.cart_items_ordered);
                displayCartTable();
            },
            error: function () {
                console.log("error cart cookie update");

            }
        });
    }

    function displayCartTable() {

        const rawCart = window.getCookieByName('cart_items');
        const rawCartOrdered = window.getCookieByName('cart_items_ordered');
        const cart = JSON.parse(rawCartOrdered) ??  {};

        const cartArray = Object.entries(cart).map(([id, item]) => ({
                id,
                title: item.title,
                accessres: item.accessres,
                type: item.type,
                size: item.size,
                children: item.children || null
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
                {className: 'dt-control',
                    orderable: false,
                    data: null,
                    defaultContent: ''},
                {data: 'title', title: Drupal.t('Title'), render: function (data, type, row, meta) {
                        return '<a href="/browser/metadata/' + row.id + '" target="_blank">' + row.title + '</a> ';
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

    // 1) Recursively build a nested <ul> from your children‐object
    function formatChildrenTable(children) {

        let html = '<table class="child-cart-table" style="margin:10px 0 10px 50px; border-collapse:collapse;">'
                + '<thead>'
                + '<tr>'
                + '<th style="border:1px solid #ccc;padding:4px;">ID</th>'
                + '<th style="border:1px solid #ccc;padding:4px;">Title</th>'
                + '<th style="border:1px solid #ccc;padding:4px;">Type</th>'
                + '<th style="border:1px solid #ccc;padding:4px;">Size</th>'
                + '<th style="border:1px solid #ccc;padding:4px;">Access</th>'
                + '<th style="border:1px solid #ccc;padding:4px;">Action</th>'
                + '</tr>'
                + '</thead>'
                + '<tbody>';

        $.each(children, function (id, rec) {

            var accessresClass = 'background-color: #1dd1a1;';
            if (rec.accessres !== 'public') {
                accessresClass = 'background-color: rgb(238, 82, 83);';
            }

            if (rec.title === "(no title)") {
                console.log("NOT TITLE FOUND " + id);

            }

            html += '<tr>'
                    + '<td style="border:1px solid #ccc;padding:4px;">' + id + '</td>'
                    + '<td style="border:1px solid #ccc;padding:4px;">' + rec.title + '</td>'
                    + '<td style="border:1px solid #ccc;padding:4px;">' + rec.type + '</td>'
                    + '<td style="border:1px solid #ccc;padding:4px;">' + formatBytes(rec.size) + '</td>'
                    + '<td style="border:1px solid #ccc;padding:4px;' + accessresClass + '">' + rec.accessres + '</td>'
                    + '<td style="border:1px solid #ccc;padding:4px;display: flex; gap: 5px;">'
                    + '<a href="#" id="" class="btn btn-arche-green-small download-cart-element" data-id="' + id + '">' + Drupal.t("Download") + '</a>'
                    + '<a href="#" id="" class="btn btn-arche-red-small delete-cart-element" data-id="' + id + '">' + Drupal.t("Delete") + '</a>'
                    + '</td>'
                    + '</tr>';

            // if there are deeper children, add a full‐width row with a nested table
            if (rec.children) {
                console.log("SIMPLE IF REC CHILDREN");

                html += '<tr>'
                        + `<td colspan="6" style="border:1px solid #ccc;padding:4px;">`
                        + formatChildrenTable(rec.children)
                        + '</td>'
                        + '</tr>';
            }

        });

        html += '</tbody></table>';
        return html;
    }


    // 4) add the expand/collapse listener
    $(document).delegate("#cartTable tbody td.dt-control", "click", function (e) {
        //$('#cartTable tbody').on('click', 'td.dt-control', function () {
        e.preventDefault();
        const tr = $(this).closest('tr');
        const row = cartTable.row(tr);

        if (row.child.isShown()) {
            row.child.hide();
            tr.removeClass('shown');
        } else {
            const rec = row.data();
            if (rec.children) {
                // render **all** depths in one shot
                row.child(formatChildrenTable(rec.children)).show();
            } else {
                row.child('<em>No children</em>').show();
            }
            tr.addClass('shown');
        }
    });

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
        const allChecked = $('.check_cart_item').length === $('.check_cart_item:checked').length;
        $('#check_all_items').prop('checked', allChecked);
    });

    $(document).delegate(".download-cart-element", "click", function (e) {
        e.preventDefault();
        var id = $(this).data('id');
        var baseApi = drupalSettings.arche_core_gui.apiUrl;
        // if the user is not logged in
        //&skipUnauthorized=true
        var resourceUrl = baseApi + 'download?ids[]=' + id + '&skipUnauthorized=true';
        startDownloadAndTrack(resourceUrl, id);

    });

    $(document).delegate(".delete-cart-element", "click", function (e) {
        e.preventDefault();
        console.log();
        var id = $(this).data('id');
        window.removeCartItem(id);
        reloadCartTable();
    });

    $(document).delegate("#add-resource-cart", "click", function (e) {
        e.preventDefault();

        flyIconCart();
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

    function flyIconCart() {
        const $icon = $('#iconToFly');
        const $target = $('.cart-content');

        // Clone the icon and add it to the body
        const $clone = $icon.clone().addClass('flying-cart-icon').appendTo('body');

        // Get start and end positions
        const startOffset = $icon.offset();
        const endOffset = $target.offset();

        // Set initial position
        $clone.css({
            top: startOffset.top,
            left: startOffset.left,
            fontSize: $icon.css('font-size'),
            color: "#88DBDF"
        });

        // SCROLL PAGE to bring target into view
        $('html, body').animate({
            scrollTop: endOffset.top - 100
        }, 800); // scroll duration matches fly duration


        // Trigger animation
        setTimeout(() => {
            $clone.css({
                top: endOffset.top,
                left: endOffset.left,
                transform: 'scale(0.5)',
                opacity: 0.5
            });
        }, 10);

        // Remove clone after animation
        setTimeout(() => {
            $clone.remove();
        }, 1600);
    }


});