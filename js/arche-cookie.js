jQuery(function ($) {
    $.noConflict();
    "use strict";



    /**
     * Set the cookie
     * @param {type} cname
     * @param {type} cvalue
     * @param {type} exdays
     * @returns {undefined}
     */
    window.setCartCookie2 = function (cname, cvalue, exdays) {
        //function setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/; SameSite=None; Secure";
    }

    /**
     * Remove cookie
     * @param {type} cname
     * @returns {undefined}
     */
    window.removeCartCookie2 = function (cname) {
        //function removeCookie(cname) {
        document.cookie = cname + '=; Max-Age=-99999999;';
    }

    /**
     * Get the cookie
     * @param {type} cname
     * @returns {String}
     */
    window.getCartCookie2 = function (cname) {
        //function getCookie(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }


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