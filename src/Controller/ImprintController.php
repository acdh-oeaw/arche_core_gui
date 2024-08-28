<?php

namespace Drupal\arche_core_gui\Controller;

use Symfony\Component\DependencyInjection\ContainerInterface;
use GuzzleHttp\ClientInterface;
use Symfony\Component\HttpFoundation\Response;

/**
 * Description of MetadataController
 *
 * @author nczirjak
 */
class ImprintController extends \Drupal\arche_core_gui\Controller\ArcheBaseController {

    protected $httpClient;

    public function __construct(\GuzzleHttp\ClientInterface $http_client) {
        parent::__construct();
        $this->httpClient = $http_client;
    }

    public function display() {

        // Example API endpoint URL.
        $api_url = 'https://imprint.acdh.oeaw.ac.at/7404/?locale='.$this->siteLang;
        $content = "";
        try {
            // Perform the API request.
            $response = $this->httpClient->request('GET', $api_url);
            $statusCode = $response->getStatusCode();

            if ($statusCode === 200) {
                // Get the content from the API response.
                $content = $response->getBody()->getContents();
               
            } else {
                // Handle non-200 responses, e.g., return a meaningful error message.
               $content = '<p>Unable to fetch the imprint information at this time.</p>. '. $statusCode;
            }
        } catch (\Exception $e) {
            // Handle exceptions.
            $content = '<p>There was an error fetching the imprint information.</p>';
        }
        
        $return = [
            '#theme' => 'imprint',
            '#content' => $content,
            '#cache' => ['max-age' => 0]            
        ];

        return $return;
    }

    /**
     * {@inheritdoc}
     */
    public static function create(\Symfony\Component\DependencyInjection\ContainerInterface $container) {
        return new static(
                $container->get('http_client')
        );
    }
}
