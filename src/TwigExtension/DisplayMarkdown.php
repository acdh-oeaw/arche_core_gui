<?php

namespace Drupal\arche_core_gui\TwigExtension;

use Drupal\Component\Render\MarkupInterface;
use Drupal\Component\Utility\Html;
use Drupal\Component\Utility\Xss;
use Drupal\Core\Render\Markup;
use Drupal\filter\Entity\FilterFormat;
use League\CommonMark\CommonMarkConverter;
use League\CommonMark\GithubFlavoredMarkdownConverter;
use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;

class DisplayMarkdown extends AbstractExtension {

    /**
     * {@inheritdoc}
     */
    public function getName() {
        return 'arche_core_gui_display_markdown.twig_extension';
    }

    /**
     * {@inheritdoc}
     */
    public function getFilters() {
        return [
            new TwigFilter('displayMarkdown', [$this, 'displayMarkdown'], ['is_safe' => ['html']]),
            new TwigFilter('display_markdown', [$this, 'displayMarkdown'], ['is_safe' => ['html']])            
        ];
    }

    /**
     * Render a scalar or common metadata array value as safe Markdown HTML.
     *
     * @param mixed $value
     * @param string $format
     * @return string|\Drupal\Component\Render\MarkupInterface
     */
    public function displayMarkdown(mixed $value, string $format = 'markdown'): string|MarkupInterface {
        $text = trim($this->normalizeMarkdownInput($this->normalizeValue($value)));
        if ($text === '') {
            return '';
        }

        if (in_array($format, ['markdown', 'commonmark', 'gfm'], true) && class_exists(CommonMarkConverter::class)) {
            return Markup::create($this->renderMarkdown($text, $format));
        }

        if (in_array($format, ['markdown', 'commonmark', 'gfm'], true)) {
            return Markup::create($this->renderMarkdownFallback($text));
        }

        if (function_exists('check_markup') && FilterFormat::load($format) !== null) {
            return Markup::create((string) check_markup($text, $format));
        }

        return Markup::create(nl2br(Html::escape($text), false));
    }

    /**
     * Convert Markdown text to sanitized HTML.
     *
     * @param string $text
     * @param string $format
     * @return string
     */
    private function renderMarkdown(string $text, string $format): string {
        $config = [
            'html_input' => 'escape',
            'allow_unsafe_links' => false,
            'renderer' => [
                'soft_break' => "<br>\n",
            ],
        ];

        $converter = $format === 'gfm' && class_exists(GithubFlavoredMarkdownConverter::class)
            ? new GithubFlavoredMarkdownConverter($config)
            : new CommonMarkConverter($config);

        return Xss::filter($converter->convert($text)->getContent(), $this->allowedMarkdownTags());
    }

    /**
     * Render common Markdown syntax when league/commonmark is unavailable.
     *
     * @param string $text
     * @return string
     */
    private function renderMarkdownFallback(string $text): string {
        $lines = preg_split('/\R/', $text) ?: [];
        $html = [];
        $paragraph = [];
        $listType = null;

        $flushParagraph = function () use (&$html, &$paragraph): void {
            if ($paragraph === []) {
                return;
            }

            $lines = array_map(fn(string $line): string => $this->renderInlineMarkdown($line), $paragraph);
            $html[] = '<p>' . implode('<br>', $lines) . '</p>';
            $paragraph = [];
        };

        $closeList = function () use (&$html, &$listType): void {
            if ($listType === null) {
                return;
            }

            $html[] = '</' . $listType . '>';
            $listType = null;
        };

        foreach ($lines as $line) {
            $line = trim($line);

            if ($line === '') {
                $flushParagraph();
                $closeList();
                continue;
            }

            if (preg_match('/^(#{1,6})\s+(.+)$/', $line, $matches) === 1) {
                $flushParagraph();
                $closeList();
                $level = strlen($matches[1]);
                $html[] = '<h' . $level . '>' . $this->renderInlineMarkdown($matches[2]) . '</h' . $level . '>';
                continue;
            }

            if (preg_match('/^[-*+]\s+(.+)$/', $line, $matches) === 1) {
                $flushParagraph();
                if ($listType !== 'ul') {
                    $closeList();
                    $html[] = '<ul>';
                    $listType = 'ul';
                }
                $html[] = '<li>' . $this->renderInlineMarkdown($matches[1]) . '</li>';
                continue;
            }

            if (preg_match('/^\d+\.\s+(.+)$/', $line, $matches) === 1) {
                $flushParagraph();
                if ($listType !== 'ol') {
                    $closeList();
                    $html[] = '<ol>';
                    $listType = 'ol';
                }
                $html[] = '<li>' . $this->renderInlineMarkdown($matches[1]) . '</li>';
                continue;
            }

            $closeList();
            $paragraph[] = $line;
        }

        $flushParagraph();
        $closeList();

        return Xss::filter(implode("\n", $html), $this->allowedMarkdownTags());
    }

    /**
     * Render inline Markdown safely.
     *
     * @param string $text
     * @return string
     */
    private function renderInlineMarkdown(string $text): string {
        $text = Html::escape($text);

        $text = preg_replace('/`([^`]+)`/', '<code>$1</code>', $text) ?? $text;
        $text = preg_replace('/\*\*([^*]+)\*\*/', '<strong>$1</strong>', $text) ?? $text;
        $text = preg_replace('/__([^_]+)__/', '<strong>$1</strong>', $text) ?? $text;
        $text = preg_replace('/(?<!\*)\*([^*]+)\*(?!\*)/', '<em>$1</em>', $text) ?? $text;
        $text = preg_replace('/(?<!_)_([^_]+)_(?!_)/', '<em>$1</em>', $text) ?? $text;

        return $text;
    }

    /**
     * Normalize escaped newlines commonly found in JSON-derived metadata.
     *
     * @param string $text
     * @return string
     */
    private function normalizeMarkdownInput(string $text): string {
        $text = str_replace(["\\r\\n", "\\n", "\\r"], "\n", $text);
        $text = preg_replace('~(^|[\s>])/(?:r/n|n|r)(?=([\s<]|[-*+]|\d+\.|$))~', "$1\n", $text) ?? $text;

        return $this->normalizeInlineBulletList($text);
    }

    /**
     * Convert metadata-style inline bullets into valid Markdown list lines.
     *
     * Some descriptions arrive as one-line text like "Intro. * item * item".
     * CommonMark only treats bullets as lists when they start a line.
     *
     * @param string $text
     * @return string
     */
    private function normalizeInlineBulletList(string $text): string {
        if (!str_contains($text, ' * ')) {
            return $text;
        }

        $parts = preg_split('/\s+\*\s+(?=\S)/', $text);
        if ($parts === false || count($parts) < 2) {
            return $text;
        }

        $intro = trim((string) array_shift($parts));
        $items = array_filter(array_map('trim', $parts), static fn(string $item): bool => $item !== '');
        if ($items === []) {
            return $text;
        }

        return ($intro !== '' ? $intro . "\n\n" : '') . '- ' . implode("\n- ", $items);
    }

    /**
     * HTML tags allowed after Markdown conversion.
     *
     * @return array
     */
    private function allowedMarkdownTags(): array {
        return [
            'a',
            'blockquote',
            'br',
            'code',
            'del',
            'em',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'hr',
            'li',
            'ol',
            'p',
            'pre',
            'strong',
            'table',
            'tbody',
            'td',
            'th',
            'thead',
            'tr',
            'ul',
        ];
    }

    /**
     * Normalize metadata values before Drupal text-format processing.
     *
     * @param mixed $value
     * @return string
     */
    private function normalizeValue(mixed $value): string {
        if ($value instanceof MarkupInterface) {
            return (string) $value;
        }

        if (is_scalar($value) || $value instanceof \Stringable) {
            return (string) $value;
        }

        if (!is_array($value)) {
            return '';
        }

        foreach (['value', 'title', 'description'] as $key) {
            if (isset($value[$key])) {
                return $this->normalizeValue($value[$key]);
            }
        }

        $items = [];
        foreach ($value as $item) {
            $normalized = trim($this->normalizeValue($item));
            if ($normalized !== '') {
                $items[] = $normalized;
            }
        }

        return implode("\n", $items);
    }

}
