(function ($, window) {
    "use strict";

    function normalizeMarkdownInput(value) {
        var text = String(value || '').replace(/\\r\\n|\\n|\\r/g, '\n');

        return normalizeInlineBulletList(text);
    }

    function normalizeInlineBulletList(text) {
        if (text.indexOf(' * ') === -1) {
            return text;
        }

        var parts = text.split(/\s+\*\s+(?=\S)/);
        if (parts.length < 2) {
            return text;
        }

        var intro = $.trim(parts.shift());
        var items = parts.map(function (item) {
            return $.trim(item);
        }).filter(function (item) {
            return item !== '';
        });

        if (!items.length) {
            return text;
        }

        return (intro !== '' ? intro + '\n\n' : '') + '- ' + items.join('\n- ');
    }

    function escapeHtml(value) {
        return $('<div>').text(String(value || '')).html();
    }

    function isSafeMarkdownUrl(url) {
        return /^(https?:|mailto:|\/|#)/i.test(url);
    }

    function renderInlineMarkdown(value) {
        var codeBlocks = [];
        var text = String(value || '').replace(/`([^`]+)`/g, function (match, code) {
            codeBlocks.push('<code>' + escapeHtml(code) + '</code>');
            return '\u0000CODE' + (codeBlocks.length - 1) + '\u0000';
        });

        text = escapeHtml(text);
        text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (match, label, url) {
            var decodedUrl = $('<textarea>').html(url).text();
            if (!isSafeMarkdownUrl(decodedUrl)) {
                return match;
            }

            return '<a href="' + escapeHtml(decodedUrl) + '">' + label + '</a>';
        });
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
        text = text.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
        text = text.replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1<em>$2</em>');

        return text.replace(/\u0000CODE(\d+)\u0000/g, function (match, index) {
            return codeBlocks[index] || match;
        });
    }

    function renderMarkdownDescription(value) {
        var lines = normalizeMarkdownInput(value).split(/\n/);
        var html = [];
        var paragraph = [];
        var listType = null;

        function flushParagraph() {
            if (!paragraph.length) {
                return;
            }

            html.push('<p>' + paragraph.map(renderInlineMarkdown).join('<br>') + '</p>');
            paragraph = [];
        }

        function closeList() {
            if (!listType) {
                return;
            }

            html.push('</' + listType + '>');
            listType = null;
        }

        lines.forEach(function (rawLine) {
            var line = $.trim(rawLine);
            var matches;

            if (line === '') {
                flushParagraph();
                closeList();
                return;
            }

            matches = line.match(/^(#{1,6})\s+(.+)$/);
            if (matches) {
                flushParagraph();
                closeList();
                html.push('<h' + matches[1].length + '>' + renderInlineMarkdown(matches[2]) + '</h' + matches[1].length + '>');
                return;
            }

            matches = line.match(/^[-*+]\s+(.+)$/);
            if (matches) {
                flushParagraph();
                if (listType !== 'ul') {
                    closeList();
                    html.push('<ul>');
                    listType = 'ul';
                }
                html.push('<li>' + renderInlineMarkdown(matches[1]) + '</li>');
                return;
            }

            matches = line.match(/^\d+\.\s+(.+)$/);
            if (matches) {
                flushParagraph();
                if (listType !== 'ol') {
                    closeList();
                    html.push('<ol>');
                    listType = 'ol';
                }
                html.push('<li>' + renderInlineMarkdown(matches[1]) + '</li>');
                return;
            }

            closeList();
            paragraph.push(line);
        });

        flushParagraph();
        closeList();

        return html.join('\n');
    }

    window.renderMarkdownDescription = renderMarkdownDescription;
})(jQuery, window);
