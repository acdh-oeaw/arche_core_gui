<?php

namespace Drupal\arche_core_gui\TwigExtension;

use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class SessionTwigExtension extends \Twig\Extension\AbstractExtension {

    
    /**
     * {@inheritdoc}
     * This function must return the name of the extension. It must be unique.
     */
    public function getName() {
        return 'arche_core_gui_session.twig_extension';
    }

    public function getFunctions() {
        return [
            new \Twig\TwigFunction('getSession', [$this, 'getSession']),
        ];
    }

    public function getSession($key) {
        return isset($_SESSION[$key]) ? $_SESSION[$key] : NULL;
    }
}
