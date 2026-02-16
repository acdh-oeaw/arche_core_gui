jQuery(function ($) {
    $.noConflict();
    "use strict";

    window.showCiteBlock = function () {
        $('#cite-loader').hide();

        const urlBiblatex = $('#biblaTexUrl').val();
        const baseUrl =
                urlBiblatex +
                '&lang=' +
                drupalSettings.arche_core_gui.gui_lang +
                '&format=';
        const citationEndpoints = {
            "apa-6th": baseUrl + "apa-6th-edition",
            "harvard": baseUrl + "harvard-cite-them-right",
            "vancouver": baseUrl + "nlm-citation-sequence",
            "arche-citation": baseUrl + "arche-citation-style",
            "json-csl": baseUrl + encodeURIComponent("application/vnd.citationstyles.csl+json"),
            "biblatex": baseUrl + encodeURIComponent("application/x-bibtex")
        };
        
        const $contentDiv = $('<div>', {
            id: 'citation-content',
            class: 'citation-content'
        });

        const $controls = $(`
    <div class="container">
      <div class="row justify-content-end align-items-start">
        <div class="col-auto">
          <div class="cite-selector" id="cite-selector-div"></div>
          <div id="dropdown-container"></div>
        </div>
        <div class="col-auto">
          <a href="#" class="ms-auto btn btn-arche-blue cite" id="copyCite">Copy</a><br>
          <span id="copy-cite-btn-confirmation" style="display:none;">Citation information copied!</span>
        </div>
      </div>
    </div>
  `);

        const $select = $('<select>', {
            id: 'cite-dropdown',
            class: 'btn btn-secondary dropdown-toggle'
        });

        const labels = {
            "apa-6th": "APA 6TH",
            "harvard": "HARVARD",
            "vancouver": "VANCOUVER",
            "arche-citation": "ARCHE",
            "json-csl": "JSON-CSL",
            "biblatex": "BIBLATEX"
        };

        $.each(citationEndpoints, function (key) {
            $select.append(
                    $('<option>', {
                        value: key,
                        text: labels[key] || key.toUpperCase()
                    })
                    );
        });

        $controls.find('#dropdown-container').append($select);
        
        $('#cite-main-div').empty().append($contentDiv, $controls);
        
        function escapeHtml(str) {
            return String(str)
                    .replaceAll('&', '&amp;')
                    .replaceAll('<', '&lt;')
                    .replaceAll('>', '&gt;')
                    .replaceAll('"', '&quot;')
                    .replaceAll("'", '&#039;');
        }

        function tryParseJson(text) {
            if (typeof text !== 'string')
                return {ok: false};
            const t = text.trim();
            if (!(t.startsWith('{') || t.startsWith('[')))
                return {ok: false};
            try {
                return {ok: true, value: JSON.parse(t)};
            } catch (e) {
                return {ok: false};
            }
        }

        function renderRaw(textOrObj) {
            const raw =
                    typeof textOrObj === 'string' ? textOrObj : JSON.stringify(textOrObj, null, 2);

            $contentDiv.html('<pre class="citation-raw" style="white-space: pre-wrap;word-break: break-word;overflow-wrap: anywhere;">' + escapeHtml(raw) + '</pre>');
        }

        function setCopyConfirmation(show) {
            const $c = $('#copy-cite-btn-confirmation');
            if (show) {
                $c.stop(true, true).show();
                setTimeout(() => $c.fadeOut(250), 1200);
            } else {
                $c.hide();
            }
        }

        function getCopyText() {
            const pre = $contentDiv.find('pre')[0];
            if (pre)
                return (pre.textContent || '').trim();
            return ($contentDiv.text() || '').trim();
        }

        async function copyToClipboard(text) {
            if (!text)
                return false;

            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            }

            const $tmp = $('<textarea>')
                    .val(text)
                    .css({position: 'fixed', left: '-9999px', top: '0'})
                    .appendTo('body');

            $tmp[0].focus();
            $tmp[0].select();
            const ok = document.execCommand('copy');
            $tmp.remove();
            return ok;
        }

        function loadCitation(styleKey) {
            const endpoint = citationEndpoints[styleKey];
            if (!endpoint)
                return;

            $contentDiv.html("");
            $('#cite-loader').show();
            setCopyConfirmation(false);

            $.ajax({
                url: endpoint,
                method: 'GET',
                dataType: 'text',
                headers: {Accept: '*/*'}
            })
                    .done(function (data, _textStatus, jqXHR) {
                        $('#cite-loader').hide();
                        const contentType = (jqXHR.getResponseHeader('Content-Type') || '').toLowerCase();

                        const forceRaw =
                                styleKey === 'json-csl' ||
                                styleKey === 'biblatex' ||
                                contentType.includes('application/json') ||
                                contentType.includes('+json') ||
                                contentType.includes('application/x-bibtex') ||
                                contentType.includes('text/x-bibtex');

                        if (forceRaw) {
                            const parsed = tryParseJson(data);
                            renderRaw(parsed.ok ? parsed.value : data);
                        } else {
                            $contentDiv.html(data);
                        }
                    })
                    .fail(function (jqXHR) {
                        $('#cite-loader').hide();
                        const msg = jqXHR.responseText ? jqXHR.responseText : 'Error loading citation.';
                        renderRaw(msg);
                    });
        }

        $select.on('change', function () {
            loadCitation($(this).val());
        });

        $(document).off('click.citeCopy', '#copyCite').on('click.citeCopy', '#copyCite', async function (e) {
            e.preventDefault();

            const text = getCopyText();
            if (!text)
                return;

            try {
                await copyToClipboard(text);
                setCopyConfirmation(true);
            } catch (err) {
                setCopyConfirmation(false);
            }
        });

        loadCitation($select.val());
    };

});
