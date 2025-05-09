<?php

namespace Drupal\arche_core_gui\TwigExtension;

use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;


class GetInstanceTwigExtension extends \Twig\Extension\AbstractExtension {

    /**
     * {@inheritdoc}
     * This function must return the name of the extension. It must be unique.
     */
    public function getName() {
        return 'arche_core_gui_get_instance.twig_extension';
    }

     public function getFunctions() {
        return [
            new \Twig\TwigFunction('get_arche_instance', [$this, 'get_arche_instance']),
        ];
    }

 
    public function get_arche_instance() {
        if (isset($_GET['instance'])) {
            $instance = $_GET['instance'];
            return htmlspecialchars($instance);
        }

        return "";
    }
}
