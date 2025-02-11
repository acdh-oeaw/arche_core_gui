<?php

namespace Drupal\arche_core_gui\Controller;

use Drupal\Core\Cache\Cache;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

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

    /**
     * This function is called if the user is jumping inside the arche content, 
     * it will rerender the metadata view
     * @param string $identifier
     * @return Response
     */
    public function detailAjaxView(string $identifier): Response {

        $api = new \Drupal\arche_core_gui_api\Controller\ApiController();
        $data = $api->expertData($identifier, "en");
        $content = $data->getContent();

        if (!empty($content)) {
            $content = json_decode($content, true);
            $confObj = new \stdClass();
            $confObj->baseUrl = $this->repoDb->getBaseUrl();
            $obj = new \Drupal\arche_core_gui\Object\ResourceCoreObject($content['data'], $confObj, $this->siteLang);
            
            $isConceptOrConceptScheme = $obj->isConceptOrConceptScheme();
            
            if(!empty($isConceptOrConceptScheme)) {
                return new \Drupal\Core\Routing\TrustedRedirectResponse($isConceptOrConceptScheme);
            }
        }

        $return = [
            '#theme' => 'arche-detail',
            '#identifier' => $identifier,
            '#data' => $obj,
            '#cache' => ['max-age' => 0],
            '#cookie' => $_COOKIE,
            '#attached' => [
                'library' => [
                    'arche_core_gui/detail-view',
                ]
            ]
        ];

        return new \Symfony\Component\HttpFoundation\Response(\Drupal::service('renderer')->renderPlain($return));
    }

    /**
     * Resource Metadata view
     * @param string $identifier
     * @return string
     */
    public function detailView(string $identifier) {
        
        $api = new \Drupal\arche_core_gui_api\Controller\ApiController();
        $data = $api->expertData($identifier, $this->siteLang);
       
        $content = $data->getContent();
        
        $return = [
            '#theme' => 'arche-detail-empty'
        ];

        if (!empty($content) && $content !== '["There is no resource"]') {
            $content = json_decode($content, true);
            $confObj = new \stdClass();
            $confObj->baseUrl = $this->repoDb->getBaseUrl();
          
            $obj = new \Drupal\arche_core_gui\Object\ResourceCoreObject($content['data'], $confObj, $this->siteLang);
            if ($obj->getRepoID() === '') {
                return [
                    '#theme' => 'arche-detail-empty'
                ];
            }
         
            $return = [
                '#theme' => 'arche-detail',
                '#identifier' => $identifier,
                '#data' => $obj,
                '#cache' => ['max-age' => 0],
                '#cookie' => $_COOKIE,
                '#attached' => [
                    'library' => [
                        'arche_core_gui/detail-view',
                    ]
                ]
            ];
        }
        return $return;
    }

    /**
     * The main discover/smartsearch view
     * @param type $str
     * @return string
     */
    public function discoverView($str = NULL) {
        
        $return = [
            '#theme' => 'arche-discover',
            '#cache' => ['max-age' => 0],
            '#vcrUrl' => $this->config->clarinVcrUrl,
            '#attached' => [
                'library' => [
                    'arche_core_gui/discover-view',
                ]
            ]
        ];
        return $return;
    }
}
