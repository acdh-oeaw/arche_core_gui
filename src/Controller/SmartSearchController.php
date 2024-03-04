<?php

namespace Drupal\arche_core_gui\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\Response;

/**
 * Description of SearchViewController
 *
 * @author nczirjak
 */
class SmartSearchController extends \Drupal\arche_core_gui\Controller\ArcheBaseController
{
    public function display()
    {
        return [
            '#theme' => 'arche-smart-search-view',
            '#data' => null,
            '#attached' => [
                'library' => [
                    'arche_core_gui/smart-search-style',
                ]
            ],
            '#cache' => ['max-age' => 0]
        ];
    }
}
