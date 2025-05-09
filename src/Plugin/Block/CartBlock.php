<?php
/**
 * @file
 * Contains \Drupal\arche_core_gui\Plugin\Block\CartBlock.
 */

namespace Drupal\arche_core_gui\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a 'CartBlock' block.
 *
 * @Block(
 *   id = "cart_block",
 *   admin_label = @Translation("ARCHE Cart Block"),
 *   category = @Translation("Custom ARCHE block")
 * )
 */
class CartBlock extends BlockBase
{

    /**
     * Class block
     *
     * @return type
     */
    public function build()
    {
        
        $return = array(
            '#theme' => 'helper-cart-block',
        );
        return $return;
    }
}
