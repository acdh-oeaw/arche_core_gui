jQuery(function ($) {
    $.noConflict();
    "use strict";

    window.setCartCookie = function (data) {
        const json = JSON.stringify(data);
        document.cookie = "cart_items=" + json + "; path=/; max-age=" + (30 * 24 * 60 * 60);
    }

    window.setCartCookieJson = function (json) {
        document.cookie = "cart_items=" + json + "; path=/; max-age=" + (30 * 24 * 60 * 60);
    }
    
    window.setCartCookieOrderedJson = function (json) {
        document.cookie = "cart_items_ordered=" + json + "; path=/; max-age=" + (30 * 24 * 60 * 60);
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
    
    window.getCartCookieOrdered = function () {

        const match = document.cookie.match(/(?:^|;\s*)cart_items_ordered=([^;]*)/);
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
        var cart = getCartCookie();
        if(cart === null) {
            cart = {};
        }
        console.log("addCartItem");
        console.log(itemData);
        console.log(id);
        console.log(cart);
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

    window.deleteCartCookie = function () {
        document.cookie = "cart_items=; path=/; max-age=0";
        document.cookie = "cart_items_ordered=; path=/; max-age=0";
    }


});