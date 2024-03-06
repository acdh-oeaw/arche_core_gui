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
class DisseminationController extends \Drupal\arche_core_gui\Controller\ArcheBaseController {

    private $tmpDir; 
    
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
    public function threedView(string $identifier) {
        $this->setTmpDir();
        //download the file
        $identifier = $this->repoDb->getBaseUrl().$identifier;
        $obj = new \Drupal\arche_core_gui\Object\ThreeDObject();
        $fileObj = $obj->downloadFile($identifier, $this->tmpDir);
        
        return $return = [
            '#theme' => 'dissemination-3d-viewer',
            '#data' => $fileObj['result'],
            '#cache' => ['max-age' => 0],
            
        ];

        //return new \Symfony\Component\HttpFoundation\Response(\Drupal::service('renderer')->renderPlain($return));
    }

    private function setTmpDir() {
        if (empty($this->tmpDir)) {
            $this->tmpDir = \Drupal::service('file_system')->realpath(\Drupal::config('system.file')->get('default_scheme') . "://");
        }
    }
    
    public function iiifView(string $identifier) {
        
    }
    
    public function pdfView(string $identifier) {
        
    }
    
}
