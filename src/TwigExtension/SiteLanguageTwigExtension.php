<?php

namespace Drupal\arche_core_gui\TwigExtension;

use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class SiteLanguageTwigExtension extends \Twig\Extension\AbstractExtension {

    
    /**
     * {@inheritdoc}
     * This function must return the name of the extension. It must be unique.
     */
    public function getName() {
        return 'arche_core_gui_site_language.twig_extension';
    }

    public function getFunctions() {
        return [
            new \Twig\TwigFunction('getActualLanguage', [$this, 'getActualLanguage']),
        ];
    }

    public function getActualLanguage() {
        $lang = \Drupal::languageManager()->getCurrentLanguage()->getId();
        return !empty($lang) ? $lang : 'en';
    }
}
