<?php

namespace Drupal\arche_core_gui\Controller;

use Drupal\Core\Cache\Cache;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Description of CartController
 *
 * @author nczirjak
 */
class CartController extends \Drupal\arche_core_gui\Controller\ArcheBaseController {

    public function showContent() {

       

        

        $return = [
            '#theme' => 'arche-cart',
            '#cache' => ['max-age' => 0],
            '#attached' => [
                'library' => [
                    'arche_core_gui/cart-view',
                ]
            ]
        ];
        return $return;
    }
}
