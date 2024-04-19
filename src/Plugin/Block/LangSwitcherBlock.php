<?php
/**
 * @file
 * Contains \Drupal\arche_core_gui\Plugin\Block\LangSwitcherBlock.
 */

namespace Drupal\arche_core_gui\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a 'LangSwitcherBlock' block.
 *
 * @Block(
 *   id = "lang_switcher_block",
 *   admin_label = @Translation("ARCHE Language Switcher"),
 *   category = @Translation("Custom ARCHE language switcher")
 * )
 */
class LangSwitcherBlock extends BlockBase
{

    /**
     * Class block
     *
     * @return type
     */
    public function build()
    {
        if (isset($_SESSION['language'])) {
            $lang = strtolower($_SESSION['language']);
        } else {
            $lang = "en";
        }
        
        $return = array(
            '#theme' => 'helper-lng-switcher',
            '#language' => $lang
        );
        return $return;
    }
}
