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
        
        $diss = $this->getDissServices($identifier);
        $lorisUrl = "";
        if(isset($diss['iiif'])) {
            $lorisUrl = $diss['iiif']['uri'];
        }
        
        return $return = [
            '#theme' => 'dissemination-iiif-viewer',
            '#data' => $lorisUrl,
            '#cache' => ['max-age' => 0],
            '#attached' => [
                'library' => [
                    'arche_core_gui/dissemination-iiif',
                ]
            ]
        ];
    }
    
    public function pdfView(string $identifier) {
        
        return $return = [
            '#theme' => 'dissemination-pdf-viewer',
            '#data' => $this->repoDb->getBaseUrl().$identifier,
            '#cache' => ['max-age' => 0],
            '#attached' => [
                'library' => [
                    'arche_core_gui/dissemination-pdf',
                ]
            ]
        ];
    }
    
    /**
     * Get the available diss services for a given resource
     * @param string $id
     * @return array
     */
    private function getDissServices(string $id): array
    {   
        $result = array();
        //internal id
        $repDiss = new \acdhOeaw\arche\lib\disserv\RepoResourceDb($this->repoDb->getBaseUrl().$id, $this->repoDb);
        try {
            $dissServ = array();
            $dissServ = $repDiss->getDissServices();
            $shown = [];
            foreach ($dissServ as $k => $v) {
                //we need to remove the gui from the diss serv list because we are on the gui
                if (strtolower($k) != 'gui') {
                    $hash = spl_object_hash($v);
                    if (!isset($shown[$hash])) {
                        try {
                            //if the dissemination services has a title then i will use it, if not then the hasReturnType as a label
                            if ($v->getGraph()->get($this->repoDb->getSchema()->label)->__toString()) {
                                $kt = $v->getGraph()->get($this->repoDb->getSchema()->label)->__toString();
                            }
                            $result[$k]['uri'] = (string) $v->getRequest($repDiss)->getUri();
                            $result[$k]['title'] = (string) $kt;
                            //if we have a description then we will use it
                            if ($v->getGraph()->get($this->repoDb->getSchema()->__get('namespaces')->ontology.'hasDescription')->__toString()) {
                                $result[$k]['description'] = $v->getGraph()->get($this->repoDb->getSchema()->__get('namespaces')->ontology.'hasDescription')->__toString();
                            }
                            $shown[$hash] = true;
                        } catch (\Exception $ex) {
                            error_log(print_r($ex->getMessage(), true));
                            \Drupal::logger('acdh_repo_gui')->notice($ex->getMessage());
                        }
                    }
                }
            }
           
            
            return $result;
        } catch (\Exception $ex) {
            return array();
        } catch (\GuzzleHttp\Exception\ServerException $ex) {
            return array();
        } catch (\acdhOeaw\arche\lib\exception\RepoLibException $ex) {
            return array();
        }
    }
    
}
