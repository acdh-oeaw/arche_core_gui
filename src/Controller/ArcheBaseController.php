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
    protected array | null $userRoles = null;
    protected string | null $userName = null;

    public function __construct() {
        (isset($_SESSION['language'])) ? $this->siteLang = strtolower($_SESSION['language']) : $this->siteLang = "en";
        $this->config = Config::fromYaml(\Drupal::service('extension.list.module')->getPath('arche_core_gui') . '/config/config.yaml');
        
        try {
            $this->pdo = new \PDO($this->config->dbConnStr);
            $baseUrl = $this->config->rest->urlBase . $this->config->rest->pathBase;
            $this->schema = new \acdhOeaw\arche\lib\Schema($this->config->schema);
            $headers = new \acdhOeaw\arche\lib\Schema($this->config->rest->headers);
            $nonRelProp = $this->config->metadataManagment->nonRelationProperties ?? [];
            $this->repoDb = new RepoDb($baseUrl, $this->schema, $headers, $this->pdo, $nonRelProp);
            $this->ontology =  \acdhOeaw\arche\lib\schema\Ontology::factoryDb($this->pdo, $this->schema, $this->config->ontologyCacheFile ?? '', $this->config->ontologyCacheTtl ?? 600);
            if (isset($this->config->authLoginCookie && !empty($_COOKIE[$this->config->authLoginCookie]))) {
                $this->usergRoles = explode(',', $_COOKIE[$config->authLoginCookie]);
                $this->userName = reset($this->userRoles);
            }
        } catch (\Exception $ex) {
            \Drupal::messenger()->addWarning($this->t('Error during the BaseController initialization!') . ' ' . $ex->getMessage());
            return array();
        }
    }

    /**
     * For a given page URL returns ARCHE-internal and SSO authorization redirection URLs
     * @return array<string, string>
     */
    protected function getLoginUrls(string $currentPageUrl): array {
        $archeUserUrl = $this->repoDb->getBaseUrl . 'user?redirect=' . rawurlencode($currentPageUrl);
        return [
            'arche' => $archeUserUrl,
            'sso' => '/Shibboleth.sso/Login?target=' . rawurlencode($archeUserUrl),
        ];
    }

    /**
     * Checks if the user can read a resource with a given set of values of the $schema->aclRead property
     * @param array<string> $aclReadValues array of $schema->aclRead property values
     * @return bool
     */
    protected function checkAccessRights(array $aclReadValues): bool {
        return count(array_intersect($aclReadValues, $this->userRoles ?? []) > 0);
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
