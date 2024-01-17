<?php

namespace Drupal\arche_core_gui\Controller;

use Drupal\Core\Cache\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Description of MetadataController
 *
 * @author nczirjak
 */
class MetadataController extends \Drupal\arche_core_gui\Controller\ArcheBaseController {

    public function __construct() {
        parent::__construct();
        $this->helper = new \Drupal\arche_core_gui\Helper\ArcheCoreHelper();
    }
    
    public function detailView(string $identifier) {
        
       
         $return = [
            '#theme' => 'arche-detail',
            '#identifier' => $identifier,
            '#cache' => ['max-age' => 0],
            '#attached' => [
                'library' => [
                    'arche_core_gui/detail-view',
                ]
            ]
        ];

        return $return;
    }

    
    public function discoverView() {
        echo "discover view";
        return [];
    }
    
    
    /**
     * the detail view
     *
     * @param string $identifier
     * @return type
     */
    public function view(string $identifier) {
        \Drupal::service('page_cache_kill_switch')->trigger();
        
        $data = [];
        if ($this->helper->isCacheExists($identifier)) {
            echo "cache";
            $data = \Drupal::cache()->get($identifier);
            $data = $data->data;
        } else {
            echo "api call: ".'https://arche-dev.acdh-dev.oeaw.ac.at/browser/api/core/expert/' . $identifier . '/en';
            $data = $this->helper->fetchApiEndpoint('https://arche-dev.acdh-dev.oeaw.ac.at/browser/api/core/expert/' . $identifier . '/en');
           
            if (!empty($data)) {
                \Drupal::cache()->set($identifier, $data, Cache::PERMANENT);
            }
        }
        $data = json_decode($data, true);
       
        $obj = new \Drupal\acdh_repo_gui\Object\ResourceCoreObject((array)$data['data'], $this->repoDb);
        
        $return = [
            '#theme' => 'arche-core-detail',
            '#identifier' => $identifier,
            '#data' => $obj,
            '#cache' => ['max-age' => 0],
            
        ];

        return $return;
    }

}
