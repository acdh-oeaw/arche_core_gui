<?php

namespace Drupal\arche_core_gui\Controller;

use Drupal\Core\Controller\ControllerBase;

/**
 * Description of ArcheBaseController
 *
 * @author nczirjak
 */
class ArcheBaseController extends ControllerBase
{
    protected $config;
    protected $repoDb;
    protected $siteLang;
    protected $helper;
    protected $model;

    public function __construct()
    {
        
        (isset($_SESSION['language'])) ? $this->siteLang = strtolower($_SESSION['language']) : $this->siteLang = "en";
        $this->config = \Drupal::service('extension.list.module')->getPath('arche_core_gui') . '/config/config.yaml';
        
        try {
            $this->repoDb = \acdhOeaw\arche\lib\RepoDb::factory($this->config);
        } catch (\Exception $ex) {
            \Drupal::messenger()->addWarning($this->t('Error during the BaseController initialization!').' '.$ex->getMessage());
            return array();
        }
    }
}
