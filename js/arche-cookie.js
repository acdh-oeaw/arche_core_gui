jQuery(function ($) {
    $.noConflict();
    "use strict";
    
    window.setCartCookie = function (data) {
        const json = JSON.stringify(data);
        document.cookie = "cart_items=" + json + "; path=/; max-age=" + (30 * 24 * 60 * 60);
    }

    window.getCartCookie = function () {

        const match = document.cookie.match(/(?:^|;\s*)cart_items=([^;]*)/);
        if (match) {
            try {
                return JSON.parse(match[1]);
            } catch (e) {
                return {};
            }
        }
        return {};
    }

    window.addCartItem = function (id, itemData) {
        const cart = getCartCookie();
        cart[id] = itemData;
        setCartCookie(cart);
    }
    window.removeCartItem = function (id) {
        const cart = getCartCookie();
        delete cart[id];
        setCartCookie(cart);
    }

    window.getCookieByName = function (name) {

        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [key, value] = cookie.trim().split('=');
            if (key === name) {
                return value;
            }
        }
        return null;
    }


});