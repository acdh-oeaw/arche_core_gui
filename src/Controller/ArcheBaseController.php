<?php

namespace Drupal\arche_core_gui\Controller;

use Drupal\Core\Controller\ControllerBase;
use acdhOeaw\arche\lib\Config;
use acdhOeaw\arche\lib\RepoDb;
use acdhOeaw\arche\lib\schema\Ontology;

/**
 * Description of ArcheBaseController
 *
 * @author nczirjak
 */
class ArcheBaseController extends ControllerBase {
    protected Config $config;
    protected RepoDb $repoDb;
    protected Ontology $ontology;
    protected $siteLang;
    protected $helper;
    protected $model;
    protected \PDO $pdo;
    protected \acdhOeaw\arche\lib\Schema $schema;

    public function __construct() {
        (isset($_SESSION['language'])) ? $this->siteLang = strtolower($_SESSION['language']) : $this->siteLang = "en";
        $this->config = Config::fromYaml(\Drupal::service('extension.list.module')->getPath('arche_core_gui') . '/config/config.yaml');
        $this->checkTmpDirs();
        try {
            $this->pdo = new \PDO($this->config->dbConnStr);
            $baseUrl = $this->config->rest->urlBase . $this->config->rest->pathBase;
            $this->schema = new \acdhOeaw\arche\lib\Schema($this->config->schema);
            $headers = new \acdhOeaw\arche\lib\Schema($this->config->rest->headers);
            $nonRelProp = $this->config->metadataManagment->nonRelationProperties ?? [];
            $this->repoDb = new RepoDb($baseUrl, $this->schema, $headers, $this->pdo, $nonRelProp);
            $this->ontology =  \acdhOeaw\arche\lib\schema\Ontology::factoryDb($this->pdo, $this->schema, $this->config->ontologyCacheFile ?? '', $this->config->ontologyCacheTtl ?? 600);
        } catch (\Exception $ex) {
            \Drupal::messenger()->addWarning($this->t('Error during the BaseController initialization!') . ' ' . $ex->getMessage());
            return array();
        }
    }
    
    private function checkTmpDirs(){
        //translations
        // Ensure the directory exists (you may need to create it)
        \Drupal::service('file_system')->prepareDirectory('public://translations', \Drupal\Core\File\FileSystemInterface::CREATE_DIRECTORY);
        
        //tmp_files
        // Define a path for the temporary files subdirectory
        // Ensure the directory exists (you may need to create it)
        \Drupal::service('file_system')->prepareDirectory('public://tmp_files', \Drupal\Core\File\FileSystemInterface::CREATE_DIRECTORY);

        //config - sites/default/files/config_tlpXNA-ReYSeqYjmFBBCPxdygkZ95C_n73LVRKAXtzVywwEXIa2HSiI8OMNjzjxZcXYpMKd3ug/sync
        \Drupal::service('file_system')->prepareDirectory('public://config_tlpXNA-ReYSeqYjmFBBCPxdygkZ95C_n73LVRKAXtzVywwEXIa2HSiI8OMNjzjxZcXYpMKd3ug', \Drupal\Core\File\FileSystemInterface::CREATE_DIRECTORY);
        \Drupal::service('file_system')->prepareDirectory('public://config_tlpXNA-ReYSeqYjmFBBCPxdygkZ95C_n73LVRKAXtzVywwEXIa2HSiI8OMNjzjxZcXYpMKd3ug/sync', \Drupal\Core\File\FileSystemInterface::CREATE_DIRECTORY);
    }
    
    /**
     * If the API needs a different response language then we have to change the
     * session lang params to get the desired lang string translation
     * @param string $lang
     * @return void
     */
    protected function changeAPILanguage(string $lang): void {
        if($this->getCurrentLanguage() !== $lang) {
            $_SESSION['language'] = $lang;
            $_SESSION['_sf2_attributes']['language'] = $lang;    
        }        
    }

    /**
     * Get the site actual language
     * @return type
     */
    private function getCurrentLanguage() {
        $current_language = \Drupal::languageManager()->getCurrentLanguage();
        // Get the language code, for example 'en' for English.
        $language_code = $current_language->getId();
        return $language_code;
    }
}
