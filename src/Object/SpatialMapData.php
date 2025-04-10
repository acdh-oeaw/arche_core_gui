<?php

namespace Drupal\arche_core_gui\Object;

/**
 * Description of ThreeDObject
 *
 * @author nczirjak
 */
class SpatialMapData {

    private $client;
    private $url;
    private $id;
    private $mapData;

    public function __construct() {
        $this->client = new \GuzzleHttp\Client(['verify' => false]);
    }

    /**
     * Return the result array with data and type
     * @param type $url
     * @return array
     */
    public function getData($url): array {
        $result = [];
        $this->url = $url;
        
        $this->mapData = $this->doTheRequest();
        if(count($this->mapData) > 0) {
            
            $this->id = $this->mapData[0]['id'];
            $type = $this->getMapTypeSpatial();
            $result['type'] = $type;
            if($type === 'polygon') {
                $result['data'] = $this->getPolygon();
                return $result;
            } else {
                $result['data'] = $this->getCoordinates();
                return $result;
            }   
        }
        return [];
    }

    /**
     * Guzzle api request to fetch the other resource map data by id
     * @return array
     */
    private function doTheRequest(): array {
        $this->client = new \GuzzleHttp\Client(['verify' => false]);
        $request = new \GuzzleHttp\Psr7\Request('GET', $this->url);

        try {
            $response = $this->client->send($request);
            if ($response->getStatusCode() == 200) {
                return json_decode($response->getBody(), true);
            }
        } catch (\GuzzleHttp\Exception\ClientException $ex) {
            \Drupal::logger('acdh_repo_core_gui')->notice($ex->getMessage());
        } catch (\Exception $ex) {
            \Drupal::logger('acdh_repo_core_gui')->notice($ex->getMessage());
        }
        
        return [];
    }

    /**
     *  get the map type
     * @param array $data
     * @return string
     */
    private function getMapTypeSpatial(): string {
        if (isset($this->mapData[0]["acdh:hasWKT"][$this->id]['en'][0]['value']) && !empty($this->mapData[0]["acdh:hasWKT"][$this->id]['en'][0]['value'])) {
            if (strpos(strtolower($this->mapData[0]["acdh:hasWKT"][$this->id]['en'][0]['value']), 'multipolygon') !== false) {
                return 'multipolygon';
            } elseif (strpos(strtolower($this->mapData[0]["acdh:hasWKT"][$this->id]['en'][0]['value']), 'polygon') !== false) {
                return 'polygon';
            } elseif ($this->mapData[0]["acdh:hasLatitude"][$this->id]['en'][0]['value']) {
                return 'coordinates';
            }
        }
        return "";
    }

    /**
     * Add Multipolygon string for the polygon dataset, othwerwise the js plugin cant handle it
     * @return string
     */
    private function getPolygon(): string {
        $str = "";
        
        if (isset($this->mapData[0]["acdh:hasWKT"][$this->id]['en'][0]['value']) && 
            !empty($this->mapData[0]["acdh:hasWKT"][$this->id]['en'][0]['value'])) {
            $str = $this->checkMultiPolygonMapString();
            $coordinatePairs = explode(",", $str);

            // Initialize an empty array to store formatted coordinates
            $formattedCoordinates = [];
            // Iterate through each coordinate pair
            foreach ($coordinatePairs as $pair) {
                if (substr($pair, 0, 1) === ' ' || substr($pair, -1) === ' ') {
                    // Remove the first and last character (spaces) if condition is true
                    $pair = substr($pair, 1, -1);
                }
                // Split each pair into longitude and latitude components
                $components = explode(" ", $pair);

                // Format the components as an array and add to the formatted coordinates array
                $formattedCoordinates[] = "[" . $components[1] . ", " . $components[0] . "]";
            }
            // Join the formatted coordinates array into a string with commas
            $str = implode(", ", $formattedCoordinates);
        }
        return $str;
    }

    public function getCoordinates(): string {
        $str = "";

        if (isset($this->mapData["acdh:hasLongitude"][$this->id]['en'][0]['value']) && !empty($this->mapData["acdh:hasLongitude"][$this->id]['en'][0]['value']) &&
                isset($this->mapData["acdh:hasLatitude"][$this->id]['en'][0]['value']) && !empty($this->mapData["acdh:hasLatitude"][$this->id]['en'][0]['value'])) {
            $str = "[" . $this->mapData["acdh:hasLatitude"][$this->id]['en'][0]['value'] . ", " . $this->mapData["acdh:hasLongitude"][$this->id]['en'][0]['value'] . "]";
        } elseif (isset($this->mapData["acdh:hasWKT"][$this->id]['en'][0]['value']) && !empty($this->mapData["acdh:hasWKT"][$this->id]['en'][0]['value'])) {
            $matches = "";
            preg_match('/POINT\(([^,]+) \s*([^)]+)\)/', $this->mapData["acdh:hasWKT"][$this->id]['en'][0]['value'], $matches);

            if (!empty($matches)) {
                // Swap the coordinates: $matches[1] is the first value, $matches[2] is the second value
                $swappedCoordinates = "POINT({$matches[2]} {$matches[1]})";
                $str = $swappedCoordinates;
            }
        }
        return $str;
    }
    
    
     private function checkMultiPolygonMapString(): string {
        if (strpos(strtolower($this->mapData[0]["acdh:hasWKT"][$this->id]['en'][0]['value']), 'multipolygon') !== false) {
            return str_replace(')', '', str_replace('(', '', str_replace('MULTIPOLYGON', '', $this->mapData[0]["acdh:hasWKT"][$this->id]['en'][0]['value'])));
        } elseif (strpos(strtolower($this->mapData[0]["acdh:hasWKT"][$this->id]['en'][0]['value']), 'polygon') !== false) {
            return str_replace(')', '', str_replace('(', '', str_replace('POLYGON', '', $this->mapData[0]["acdh:hasWKT"][$this->id]['en'][0]['value'])));
        }
        return "";
    }

}
