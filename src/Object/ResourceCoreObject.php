<?php

namespace Drupal\arche_core_gui\Object;

use Drupal\acdh_repo_gui\Helper\ArcheHelper as Helper;

class ResourceCoreObject {

    private $config;
    private $properties;
    private $acdhid;
    private $repoid;
    private $language = 'en';
    private $thumbUrl = 'https://arche-thumbnails.acdh.oeaw.ac.at/';
    private $biblatexUrl = 'https://arche-biblatex.acdh.oeaw.ac.at/';
    private $audioCategories = array('audio', 'sound', 'speechrecording', 'speech');
    private $iiifFormats = array('image/jpeg', 'image/png', 'image/tiff');
    private $publicAccessValue = 'https://vocabs.acdh.oeaw.ac.at/archeaccessrestrictions/public';
    private $publicAccessTitle = ['public', 'öffentlich'];
    private $accessLevels = ['public' => 'öffentlich', 'academic' => 'akademisch', 'restricted' => 'eingeschränkt'];
    private $publicationTableProperties = ['acdh:relation','acdh:continues','acdhisContinuedBy', 'acdh:documents',
            'acdh:isDocumentedBy','acdh:isDerivedPublicationOf','acdh:isSourceOf','acdh:hasSource']; 

    public function __construct(array $data, object $config, string $language = 'en') {
        $this->properties = array();
        $this->config = $config;
        $this->language = $language;
       
        foreach ($data as $k => $v) {
            if (is_array($v)) {

                foreach ($v as $propval) {
                    $firstArr = reset($propval);
                    if (isset($propval[$this->language])) {
                        $this->setData($k, $propval[$this->language]);
                    } else {
                        $this->setData($k, $firstArr);
                    }
                }
            }
        }


        //set acdhid /repoid / repourl
        $this->repoid = $this->getRepoID();
    }

    /**
     * Get the biblatex disserv url
     * @return string
     */
    public function getBiblatexUrl(): string {
        return $this->biblatexUrl . '?id=' . $this->getRepoUrl() . '&lang=' . $this->language;
    }

    /**
     * get the data based on the property
     *
     * @param string $property
     * @return array
     */
    public function getData(string $property): array {
        $first = [];
        if (isset($this->properties[$property])) {
            $first = reset($this->properties[$property]);
        }
        if (isset($this->properties[$property][$this->language])) {

            return $this->properties[$property][$this->language];
        } elseif (isset($this->properties[$property]['und'])) {
            return $this->properties[$property]['und'];
        } elseif (isset($first) && isset($this->properties[$property])) {
            foreach ($this->properties[$property] as $k => $v) {
                if (is_int($k)) {
                    return $this->properties[$property];
                }
                return (array) $first;
            }
        }
        return array();
    }

    /**
     *
     * Change property data
     *
     * @param string $prop
     * @param array $v
     */
    private function setData(string $prop = null, array $v = array()) {
        if (
                isset($prop) && count((array) $v) > 0
        ) {
            if(isset($v['property'])) {
                $this->addExternalURL($v);
            }
            if (isset($v['type']) && $v['type'] === 'REL') {
                $this->properties[$prop][] = $v;
            } else {
                $this->properties[$prop] = $v;
            }
        }
    }
    
    /**
     * If the property is concept or conceptscheme, then we have to add 
     * an extrnal url property.
     * @param array $v
     * @return void
     */
    private function addExternalURL(array &$v): void {
        
        if ($v['property'][$this->language] === "http://www.w3.org/2004/02/skos/core#Concept" ||
                    $v['property'][$this->language] === "http://www.w3.org/2004/02/skos/core#ConceptScheme") {

                if (isset($v['identifiers']) && count($v['identifiers']) > 0) {
                    foreach ($v['identifiers'] as $val) {
                        if ((strpos($val, $this->config->baseUrl) === false) &&
                                (strpos($val, 'https://id.acdh.oeaw.ac.at') === false) &&
                                (strpos($val, 'https://vocabs.acdh.oeaw.ac.at/rest/') === false) &&
                                (strpos($val, '.acdh.oeaw.ac.at/api/') === false) &&
                                (strpos($val, 'arche-curation.') === false) && 
                                (strpos($val, 'arche-dev.') === false)
                        ) {
                            $v['externalUrl'] = $val;
                        }
                    }
                }
            }
    }

    /**
     * Get the Resource title
     *
     * @return string
     */
    public function getTitle(): string {


        if (isset($this->properties["acdh:hasTitle"][0]['title']) && !empty($this->properties["acdh:hasTitle"][0]['title'])) {
            return $this->properties["acdh:hasTitle"][0]['title'];
        }

        if (isset($this->properties["acdh:hasTitle"][0]['value']) && !empty($this->properties["acdh:hasTitle"][0]['value'])) {
            return $this->properties["acdh:hasTitle"][0]['value'];
        }

        return "";
    }

    /**
     * All identifiers
     *
     * @return array
     */
    public function getIdentifiers(): array {
        return (isset($this->properties["acdh:hasIdentifier"][0]) && !empty($this->properties["acdh:hasIdentifier"][0])) ? $this->properties["acdh:hasIdentifier"][0] : array();
    }

    /**
     * Get all identifiers which are not acdh related
     *
     * @return type
     */
    public function getNonAcdhIdentifiers(): array {
        $result = array();

        if (isset($this->properties["acdh:hasIdentifier"][0]) && !empty($this->properties["acdh:hasIdentifier"])) {
            foreach ($this->properties["acdh:hasIdentifier"] as $k => $v) {
                if ((strpos((string) $v['value'], 'oeaw.ac.at') === false) && (strpos((string) $v['value'], $this->config->baseUrl) === false)) {
                    $result[] = $v;
                }
            }
        }
        return $result;
    }

    /**
     * Collect Vocabs identifiers for concept
     * @return array
     */
    public function getVocabsIdentifiers(): array {
        $result = array();

        if (isset($this->properties["acdh:hasIdentifier"][0]) && !empty($this->properties["acdh:hasIdentifier"])) {
            foreach ($this->properties["acdh:hasIdentifier"] as $k => $v) {
                if (strpos((string) $v['value'], 'https://vocabs.acdh.oeaw.ac.at/') !== false) {
                    $result[] = $v;
                }
            }
        }
        return $result;
    }

    /**
     * Use geonames ID, if no geonames then whatever is not ARCHE domain, else ARCHE domain
     * @return array
     */
    public function getPlaceIds(): array {
        $result = array();
        if (isset($this->properties["acdh:hasIdentifier"]) && !empty($this->properties["acdh:hasIdentifier"])) {
            foreach ($this->properties["acdh:hasIdentifier"] as $k => $v) {
                //filter out the baseurl related identifiers and which contains the id.acdh
                if ((strpos($v['value'], $this->config->baseUrl) === false) &&
                        (strpos($v['value'], 'https://id.acdh.oeaw.ac.at') === false)
                ) {
                    $result[] = $v;
                }
            }
        }

        if (count($result) === 0) {
            $result[] = $this->properties["acdh:hasIdentifier"][0];
        }
        return $result;
    }

    public function getConceptAndSchemeIdentifiers(): array {
        $result = array();
        if (isset($this->properties["acdh:hasIdentifier"]) && !empty($this->properties["acdh:hasIdentifier"])) {
            foreach ($this->properties["acdh:hasIdentifier"] as $k => $v) {
                //filter out the baseurl related identifiers and which contains the id.acdh
                if ((strpos($v['value'], $this->config->baseUrl) === false) &&
                        (strpos($v['value'], 'https://id.acdh.oeaw.ac.at') === false) &&
                        (strpos($v['value'], 'https://vocabs.acdh.oeaw.ac.at/rest/') === false) &&
                        (strpos($v['value'], '.acdh.oeaw.ac.at/api/') === false)
                ) {
                    $result[] = $v;
                }
            }
        }

        if (count($result) === 0) {
            $result[] = $this->properties["acdh:hasIdentifier"][0];
        }
        return $result;
    }

    /**
     * Get all identifiers which are not acdh api related
     *
     * @return type
     */
    public function getNonAcdhApiIdentifiers(): array {
        $result = array();
        if (isset($this->properties["acdh:hasIdentifier"][0]) && !empty($this->properties["acdh:hasIdentifier"][0])) {
            foreach ($this->properties["acdh:hasIdentifier"][0] as $k => $v) {
                //filter out the baseurl related identifiers
                if ((strpos($v['value'], $this->config->baseUrl) === false)) {
                    $result[] = $v;
                }
            }
        }
        return $result;
    }

    /**
     * PID
     *
     * @return string
     */
    public function getPid(): string {
        return (
                isset($this->properties["acdh:hasPid"][0]['value']) && !empty($this->properties["acdh:hasPid"][0]['value']) && (
                (strpos($this->properties["acdh:hasPid"][0]['value'], 'http://') !== false) ||
                (strpos($this->properties["acdh:hasPid"][0]['value'], 'https://') !== false)
                )
                ) ? $this->properties["acdh:hasPid"][0]['value'] : "";
    }

    public function getPidOrAcdhIdentifier(): string {

        if (isset($this->properties["acdh:hasPid"][0]['value']) && !empty($this->properties["acdh:hasPid"][0]['value']) && (
                (strpos($this->properties["acdh:hasPid"][0]['value'], 'http://') !== false) ||
                (strpos($this->properties["acdh:hasPid"][0]['value'], 'https://') !== false)
                )) {
            return $this->properties["acdh:hasPid"][0]['value'];
        }

        if (!empty($this->getAcdhID())) {
            return $this->getAcdhID();
        }

        if (!empty($this->getOneID())) {
            return $this->getOneID();
        }
        return "";
    }

    /**
     * Get resource inside uri
     *
     * @return string
     */
    public function getInsideUrl(): string {
        if (isset($this->properties["acdh:hasIdentifier"][0])) {
            foreach ($this->properties["acdh:hasIdentifier"][0] as $v) {
                if (isset($v->acdhid) && !empty($v->acdhid)) {
                    return str_replace('https://', '', $v->acdhid);
                }
            }
        }
        return "";
    }

    /**
     * Get the available date in a specified format
     * @return string
     */
    public function getAvailableDate(): string {
        if (isset($this->properties["acdh:hasAvailableDate"])) {
            foreach ($this->properties["acdh:hasAvailableDate"] as $v) {
                if (isset($v['value'])) {
                    $time = strtotime($v['value']);
                    return date('d m Y', $time);
                }
            }
        }
        return "";
    }

    /**
     * Get the resource acdh uuid
     *
     * @return string
     */
    public function getUUID(): string {
        if (isset($this->properties["acdh:hasIdentifier"])) {
            foreach ($this->properties["acdh:hasIdentifier"] as $v) {
                if (isset($v->acdhid) && !empty($v->acdhid)) {
                    return $v->acdhid;
                }
            }
        }
        return "";
    }

    /**
     * Get the resource acdh id
     *
     * @return string
     */
    public function getAcdhID(): string {
        if (isset($this->properties["acdh:hasIdentifier"])) {
            foreach ($this->properties["acdh:hasIdentifier"] as $v) {
                if (strpos($v['value'], '/id.acdh.oeaw.ac.at/') !== false &&
                        strpos($v['value'], '/id.acdh.oeaw.ac.at/cmdi/') === false) {
                    return $v['value'];
                }
            }
        }
        return "";
    }

    /**
     * Get the first identifier for dissemination services (Not all the time we have acdh.id...)
     * @return string
     */
    public function getOneID(): string {
        if (isset($this->properties["acdh:hasIdentifier"])) {
            return $this->properties["acdh:hasIdentifier"][0]['value'];
        }
        return "";
    }

    /**
     * Get the full repo url with the identifier for the actual resource
     *
     * @return string
     */
    public function getRepoUrl(): string {
        if (!isset($this->repoid) && empty($this->repoid)) {
            $this->getRepoID();
        }
        return $this->config->baseUrl . $this->repoid;
    }

    /**
     * Get the Gui related url for the resource
     * @return string
     */
    public function getRepoGuiUrl(): string {
        if (!isset($this->repoid) && empty($this->repoid)) {
            $this->getRepoID();
        }
        return str_replace('/api/', '/browser/metadata/', $this->config->baseUrl) . $this->repoid;
    }

    /**
     * Get the GUI base url
     * @return string
     */
    public function getRepoBaseUrl(): string {
        return str_replace('/api/', '/browser/', $this->config->baseUrl);
    }

    /**
     * Get the repo identifier
     * @return string
     */
    public function getRepoID(): string {

        if (isset($this->properties["acdh:hasIdentifier"])) {
            foreach ($this->properties["acdh:hasIdentifier"] as $v) {
                if (isset($v['id']) && !empty($v['id'])) {
                    $this->repoid = $v['id'];
                    return $v['id'];
                } else {
                    if (strpos($v['value'], $this->config->baseUrl) !== false) {
                        $this->repoid = str_replace($this->config->baseUrl, '', $v['value']);
                        return str_replace($this->config->baseUrl, '', $v['value']);
                    }
                }
            }
        }
        return "";
    }

    public function getRootID(): string {
        if (isset($this->properties["acdh:isPartOf"])) {
            foreach ($this->properties["acdh:isPartOf"] as $v) {
                if (isset($v['id']) && !empty($v['id'])) {
                    return $v['id'];
                }
            }
        }
        return "";
    }

    /**
     * Get the accessrestriction url and title
     *
     * @return array
     */
    public function getAccessRestriction(): array {
        $result = array();
        if (isset($this->properties["acdh:hasAccessRestriction"])) {
            foreach ($this->properties["acdh:hasAccessRestriction"] as $v) {
                if (isset($v['title']) && !empty($v['title'])) {
                    $result['title'] = $v['title'];
                } elseif (isset($v['value']) && !empty($v['value'])) {
                    $result['title'] = $v['value'];
                }
                if (isset($v->accessrestriction) && !empty($v->accessrestriction)) {
                    $result['uri'] = $v->accessrestriction;
                }
                if (isset($v->vocabsid) && !empty($v->vocabsid)) {
                    $result['vocabsid'] = $v->vocabsid;
                }
            }
        }
        return $result;
    }

    /**
     * Get the acdh type string
     *
     * @return string
     */
    public function getAcdhType(): string {
        if (isset($this->properties["rdf:type"])) {
            foreach ($this->properties["rdf:type"] as $v) {
                if (isset($v['title']) && !empty($v['title']) && (strpos($v['title'], 'https://vocabs.acdh.oeaw.ac.at/schema#') !== false)) {
                    return str_replace('https://vocabs.acdh.oeaw.ac.at/schema#', '', $v['title']);
                } elseif (isset($v['value']) && !empty($v['value']) && (strpos($v['value'], 'https://vocabs.acdh.oeaw.ac.at/schema#') !== false)) {
                    return str_replace('https://vocabs.acdh.oeaw.ac.at/schema#', '', $v['value']);
                } else {
                    if (isset($v['title']) && !empty($v['title'])) {
                        return str_replace('http://www.w3.org/2004/02/skos/core#', '', $v['title']);
                    }
                    if (isset($v['value']) && !empty($v['value'])) {
                        return str_replace('http://www.w3.org/2004/02/skos/core#', '', $v['value']);
                    }
                }
            }
        }
        return "";
    }

    /**
     * Display all RDF:Type Values
     * @return array
     */
    public function getRdfTypes(): array {
        $result = array();
        if (isset($this->properties["rdf:type"])) {
            foreach ($this->properties["rdf:type"] as $v) {
                if (isset($v['title']) && !empty($v['title']) && (strpos($v['title'], 'https://vocabs.acdh.oeaw.ac.at/schema#') !== false)) {
                    $result[] = Helper::createShortcut($v['title']);
                } elseif (isset($v['value']) && !empty($v['value']) && (strpos($v['value'], 'https://vocabs.acdh.oeaw.ac.at/schema#') !== false)) {
                    $result[] = Helper::createShortcut($v['value']);
                }
            }
        }
        return $result;
    }

    /**
     * Get the skos concept type for the custom gui detail view
     *
     * @return string
     */
    public function getSkosType(): string {
        if (isset($this->properties["rdf:type"])) {
            foreach ($this->properties["rdf:type"] as $v) {
                if (isset($v['title']) && !empty($v['title']) && (strpos($v['title'], 'http://www.w3.org/2004/02/skos/core#') !== false)) {
                    return str_replace('http://www.w3.org/2004/02/skos/core#', '', $v['title']);
                } elseif (isset($v['title']) && !empty($v['value']) && (strpos($v['value'], 'http://www.w3.org/2004/02/skos/core#') !== false)) {
                    return str_replace('http://www.w3.org/2004/02/skos/core#', '', $v['value']);
                }
            }
        }
        return "";
    }

    /**
     * Get all data
     *
     * @return array
     */
    public function getExpertTableData(): array {
        return $this->properties;
    }
    
    public function getPublicationDataTable(): array {
        $result = array();
        foreach($this->publicationTableProperties as $property) {
            if (isset($this->properties[$property])) {
                $item = [];
                foreach($this->properties[$property] as $k => $v) {
                    $item['#repoid'] = (string)$v['id'];
                    $item['#value'] = $v['value'];
                    $item['#property'] =  str_replace('https://vocabs.acdh.oeaw.ac.at/schema#', 'acdh:', $v['property'][$this->language]);
                    array_push($result, $item);
                }
            }
        }
        return $result;
    }

    /**
     * Format the date values for the twig template
     *
     * @param string $property
     * @param string $dateFormat
     * @return string
     */
    public function getFormattedDateByProperty(string $property, string $dateFormat = 'Y'): string {
        if (isset($this->properties[$property])) {
            if (isset($this->properties[$property][0]['value'])) {
                $val = strtotime($this->properties[$property][0]['value']);
                return date($dateFormat, $val);
            }
        }
        return '';
    }

    /**
     * Select the identifier for the Copy resource link
     * Order : PID , ID.acdh.oeaw.ac.at, arche api id
     * REDMINE ID: #19888
     * @return string
     */
    public function getCopyResourceLink(): string {
        if (!empty($this->getPid())) {
            return $this->getPid();
        }

        if (!empty($this->getAcdhID())) {
            return $this->getAcdhID();
        }
        if (!empty($this->getRepoUrl())) {
            return $this->getRepoUrl();
        }

        return "";
    }

    /**
     * Create the JS string for the leaflet map MultiPolyLang from Multipolygon data
     * @return string
     */
    public function getMultiPolygonFirstCoordinate(): string {
        $str = "";
        if (isset($this->properties["acdh:hasWKT"][0]['value']) && !empty($this->properties["acdh:hasWKT"][0]['value'])) {
            $data = array_filter(explode(" ", $this->checkMultiPolygonMapString()));
            $first_coordinate = array_slice($data, 0, 2);
            $str = "[" . $first_coordinate[1] . " " . $first_coordinate[0] . "]";
        }
        return $str;
    }

    /**
     * Create the JS string for the leaflet map MultiPolyLang from Polygon data
     * @return string
     */
    public function getPolygonFirstCoordinate(): string {
        $str = "";
        if (isset($this->properties["acdh:hasWKT"][0]['value']) && !empty($this->properties["acdh:hasWKT"][0]['value'])) {
            $data = array_filter(explode(" ", $this->checkMultiPolygonMapString()));
            $coordinate1 = $data[1];
            $coordinate2 = $data[0];
            if (strpos($data[1], ",") !== false) {
                $coordinate1 = substr($data[1], 0, strpos($data[1], ","));
            }
            if (strpos($data[0], ",") !== false) {
                $coordinate2 = substr($data[0], 0, strpos($data[0], ","));
            }
            $str = "[" . $coordinate1 . ", " . $coordinate2 . "]";
        }
        return $str;
    }

    /**
     * Transform Multipolygon string
     * @return string
     */
    private function checkMultiPolygonMapString(): string {
        if (strpos(strtolower($this->properties["acdh:hasWKT"][0]['value']), 'multipolygon') !== false) {
            return str_replace(')', '', str_replace('(', '', str_replace('MULTIPOLYGON', '', $this->properties["acdh:hasWKT"][0]['value'])));
        } elseif (strpos(strtolower($this->properties["acdh:hasWKT"][0]['value']), 'polygon') !== false) {
            return str_replace(')', '', str_replace('(', '', str_replace('POLYGON', '', $this->properties["acdh:hasWKT"][0]['value'])));
        }
        return "";
    }

    public function getCoordinates(): string {
        $str = "";

        if (isset($this->properties["acdh:hasLongitude"][0]['value']) && !empty($this->properties["acdh:hasLongitude"][0]['value']) &&
                isset($this->properties["acdh:hasLatitude"][0]['value']) && !empty($this->properties["acdh:hasLatitude"][0]['value'])) {
            $str = "[" . $this->properties["acdh:hasLatitude"][0]['value'] . ", " . $this->properties["acdh:hasLongitude"][0]['value'] . "]";
        } elseif (isset($this->properties["acdh:hasWKT"][0]['value']) && !empty($this->properties["acdh:hasWKT"][0]['value'])) {
            $matches = "";
            preg_match('/POINT\(([^,]+) \s*([^)]+)\)/', $this->properties["acdh:hasWKT"][0]['value'], $matches);

            if (!empty($matches)) {
                // Swap the coordinates: $matches[1] is the first value, $matches[2] is the second value
                $swappedCoordinates = "POINT({$matches[2]} {$matches[1]})";
                $str = $swappedCoordinates;
            }
        }
        return $str;
    }

    /**
     * Get Polygon data fpr map
     * @return string
     */
    public function getPolygon(): string {
        $str = "";

        if (isset($this->properties["acdh:hasWKT"][0]['value']) && !empty($this->properties["acdh:hasWKT"][0]['value'])) {
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

    /**
     * Get the WKT map type
     * @return string
     */
    public function getMapType(): string {

        if (isset($this->properties["acdh:hasWKT"][0]['value']) && !empty($this->properties["acdh:hasWKT"][0]['value'])) {
            if (strpos(strtolower($this->properties["acdh:hasWKT"][0]['value']), 'multipolygon') !== false) {
                return 'multipolygon';
            } elseif (strpos(strtolower($this->properties["acdh:hasWKT"][0]['value']), 'polygon') !== false) {
                return 'polygon';
            } elseif ($this->properties["acdh:hasLatitude"][0]['value']) {
                return 'coordinates';
            }
        }
        return "";
    }

    /**
     * Add Multipolygon string for the polygon dataset, othwerwise the js plugin cant handle it
     * @return string
     */
    public function getPolygonData(): string {
        if (isset($this->properties["acdh:hasWKT"][0]['value']) && !empty($this->properties["acdh:hasWKT"][0]['value'])) {
            if (strpos(strtolower($this->properties["acdh:hasWKT"][0]['value']), 'polygon') !== false) {
                $data = str_replace('Polygon', 'MultiPolygon', $this->properties["acdh:hasWKT"][0]['value']);
                $data = str_replace('POLYGON', 'MultiPolygon', $this->properties["acdh:hasWKT"][0]['value']);
                return $data;
            }
        }
        return "";
    }

    /**
     * Check the resource is a 3d object
     * @return bool
     */
    public function is3DObject(): bool {
        $cat = false;
        if (!$this->isPublic()) {
            return false;
        }

        if (isset($this->properties["acdh:hasCategory"])) {
            foreach ($this->properties["acdh:hasCategory"] as $category) {
                 if (isset($category['value']) &&
                        (
                        strtolower($category['value']) === "3d data" ||
                        strtolower($category['value']) === "3d-daten"
                        )) {
                    $cat = true;
                }
            }
        }
        if (isset($this->properties["acdh:hasBinarySize"][0]['value']) &&
                (int) $this->properties["acdh:hasBinarySize"][0]['value'] > 0 &&
                $cat) {
            return true;
        }

        return false;
    }

    /**
     * Check if the resource supports IIIF viewer
     * @return bool
     */
    public function isIIIF(): bool {
        $cat = false;
        if (!$this->isPublic()) {
            return false;
        }

        if (isset($this->properties["acdh:hasCategory"])) {
            foreach ($this->properties["acdh:hasCategory"] as $category) {
                if (isset($category['value']) &&
                        (strtolower($category['value']) === strtolower("https://vocabs.acdh.oeaw.ac.at/archecategory/image") ||
                        strtolower($category['value']) === strtolower("image") ||
                        strtolower($category['value']) === strtolower("https://vocabs.acdh.oeaw.ac.at/archecategory/bild") ||
                        strtolower($category['value']) === strtolower("bild")
                        )) {
                    $cat = true;
                }
            }
        }

        if (isset($this->properties["acdh:hasFormat"]) && $cat !== false) {
            foreach ($this->properties["acdh:hasFormat"] as $category) {
                if (in_array(strtolower($category['value']), (array) $this->iiifFormats)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * check if the Resource is an uploaded binary
     * @return bool
     */
    public function isBinary(): bool {
        //check the resource categories
        if (strtolower($this->getAcdhType()) === "resource" && isset($this->properties["acdh:hasBinarySize"][0]['value']) &&
                (int) $this->properties["acdh:hasBinarySize"][0]['value'] > 0) {
            return true;
        }

        return false;
    }

    /**
     * Check the resource has an audio, to display the audio player
     * @return bool
     */
    public function isAudio(): bool {
        $cat = false;
        if (!$this->isPublic()) {
            return false;
        }
        //check the sound categories
        if (isset($this->properties["acdh:hasCategory"])) {
            foreach ($this->properties["acdh:hasCategory"] as $category) {
                if (in_array(strtolower($category['value']), (array) $this->audioCategories)) {
                    $cat = true;
                }
            }
        }
        //check the binarysize
        if (isset($this->properties["acdh:hasBinarySize"][0]['value']) &&
                (int) $this->properties["acdh:hasBinarySize"][0]['value'] > 0 &&
                $cat) {
            return true;
        }

        return false;
    }

    /**
     * Check if the resource is a pdf file
     * @return bool
     */
    public function isPDF(): bool {
        $isPDF = false;
        if (!$this->isPublic()) {
            return false;
        }

        if (isset($this->properties["acdh:hasFormat"])) {
            foreach ($this->properties["acdh:hasFormat"] as $format) {
                if ($format['value'] == 'application/pdf') {
                    $isPDF = true;
                }
            }
        }

        if (isset($this->properties["acdh:hasBinarySize"])) {
            foreach ($this->properties["acdh:hasBinarySize"] as $binary) {
                if ((int) $binary['value'] > 1 && $isPDF) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Check if the user is logged in or not
     * @return bool
     */
    public function isUserLoggedIn(): bool {

        if (isset($this->config->authLoginCookie) && !empty($_COOKIE[$this->config->authLoginCookie])) {
            return true;
        }
        return false;
    }

    /**
     * Check the resource is public or not
     * @return bool
     */
    public function isPublic(): bool {
        $result = false;
        $access = $this->getAccessRestriction();

        /*
         * If there is no accessrestriction, then it is a collection
         */
        if (count($access) === 0) {
            return true;
        }

        if (
                count((array) $access) > 0 &&
                isset($access['vocabsid']) &&
                $access['vocabsid'] = $this->publicAccessValue) {
            $result = true;
        } elseif (count((array) $access) > 0 &&
                isset($access['title']) &&
                in_array($access['title'], $this->publicAccessTitle)) {
            $result = true;
        }
        return $result;
    }

    /**
     * Get the actual resource access level for the user login check
     * @return string
     */
    public function getResourceAccessLevel(): string {
        $access = $this->getAccessRestriction();

        if (count($access) > 0) {
            if ($this->language == "de") {
                foreach ($this->accessLevels as $k => $v) {
                    if ($v === $access['title']) {
                        return $k;
                    }
                }
            }
            return $access['title'];
        }
        $aclRead = $this->getData('acdh:aclRead');
        $aclReadArr = [];
        if (count($aclRead) > 0) {
            foreach ($aclRead as $v) {
                $aclReadArr[] = $v['value'];
            }
            return implode(',', $aclReadArr);
        }
        return 'public';
    }

    /**
     * Create the VCR data json string
     * REDMINE ID: #19076
     * @return string
     */
    public function getVCRData(): string {
        $res = new \stdClass();

        if (!empty($this->getDataString('acdh:hasDescription'))) {
            $res->description = $this->getDataString('acdh:hasDescription');
        } else {
            if ($this->getAcdhType() == "Resource") {
                $res->description = $this->getDataString('acdh:hasCategory') . ", " . $this->getDataString('acdh:hasBinarySize');
            } elseif ($this->getAcdhType() == "Collection" || $this->getAcdhType() == "TopCollection") {
                $res->description = $this->getAcdhType() . ", " . $this->getDataString('acdh:hasNumberOfItems') . ' items';
            } else {
                $res->description = "";
            }
        }

        if (!empty($this->getPid())) {
            $res->uri = $this->getPid();
        } else {
            $res->uri = $this->getAcdhID();
        }

        $res->label = $this->getTitle();

        return \GuzzleHttp\json_encode($res);
    }

    /**
     * Get the defined property String values
     * @param string $property
     * @return string
     */
    public function getDataString(string $property): string {
        if (isset($this->properties[$property][0]['title']) && !empty($this->properties[$property][0]['title'])) {
            return $this->properties[$property][0]['title'];
        } elseif (isset($this->properties[$property][0]['value']) && !empty($this->properties[$property][0]['value'])) {
            return $this->properties[$property][0]['value'];
        }
        return "";
    }

    /**
     * Fetch property which has more than one value as array or as string
     * @param string $property
     * @param string $output
     * @return mixed
     */
    public function getDataArrayString(string $property, string $output = "array"): mixed {
        $result = [];
        if (isset($this->properties[$property][0]['title']) && !empty($this->properties[$property][0]['title'])) {
            foreach ($this->properties[$property] as $val) {
                $result[] = $val['title'];
            }
        } elseif (isset($this->properties[$property][0]['value']) && !empty($this->properties[$property][0]['value'])) {
            foreach ($this->properties[$property] as $val) {
                $result[] = $val['value'];
            }
        }
        if ($output === "string") {
            return implode(',', $result);
        }
        return $result;
    }

    public function isContactDetails(): bool {
        $props = ['acdh:hasAddressLine1', 'acdh:hasAddressLine2', 'acdh:Postcode',
            'acdh:hasCity', 'acdh:hasRegion', 'acdh:hasCountry', 'acdh:hasEmail',
            'acdh:hasUrl'];
        foreach ($props as $p) {
            if (isset($this->properties[$p])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Return the metadata view right box License card content
     * @return array
     */
    public function getLicenseData(): array {
        $result = [];
        $props = [
            'acdh:hasLicense' => 'Licence',
            'acdh:hasLicenseSummary' => 'Licence Summary',
            'acdh:hasAccessRestriction' => 'Access Restriction',
            'acdh:hasAccessRestrictionSummary' => 'Access Restriction Summary',
            'acdh:hasRightsInformation' => 'Rights Information',
            'acdh:hasLicensor' => 'Licensor',
            'acdh:hasOwner' => 'Owner'
        ];

        foreach ($props as $k => $v) {
            if (isset($this->properties[$k])) {

                if (is_array($this->properties[$k])) {
                    foreach ($this->properties[$k] as $val) {
                       
                        if (isset($val['value'])) {
                            /*$obj = [];
                            if (isset($val['id']) && (int) $this->repoid !== (int) $val['id']) {
                                $obj['id'] = $val['id'];
                            }
                            $obj['value'] = $val['value'];
                            $obj['property'] = $k;
                            
                            $obj['type'] = $k;*/
                            $result[$v][] = $val;
                        }
                    }
                }
            }
        }

        return $result;
    }

    /**
     * If we need an array of propertys data
     * @param array $props
     * @return array
     */
    public function getDataByPropertyList(array $props): array {
        $result = [];
        foreach ($props as $k) {
            if (isset($this->properties[$k])) {

                if (is_array($this->properties[$k])) {
                    foreach ($this->properties[$k] as $val) {
                        if (isset($val['value'])) {
                            $result[$k][] = $val;
                        }
                    }
                }
            }
        }
        return $result;
    }

    /**
     * Return the metadata view right box Credits card content
     * @return array
     */
    public function getCreditsData(): array {
        $result = [];
        $props = [
            'acdh:hasPrincipalInvestigator' => 'Principal Investigator',
            'acdh:hasContact' => 'Contact',
            'acdh:hasEditor' => 'Editor',
            'acdh:hasAuthor' => 'Author',
            'acdh:hasCreator' => 'Creator',
            'acdh:hasContributor' => 'In collaboration with',
            'acdh:hasDigitisingAgent' => 'Digitised by',
        ];

        foreach ($props as $k => $v) {
            if (isset($this->properties[$k])) {
                if (is_array($this->properties[$k])) {
                    foreach ($this->properties[$k] as $val) {
                        if (isset($val['value'])) {
                            $result[$v][] = $val;
                        }
                    }
                }
            }
        }
        return $result;
    }

    public function getProjectDetailsData(): array {
        $result = [];
        $props = [
            'acdh:hasStartDate' => 'Project Start Date',
            'acdh:hasEndDate' => 'Project End Date',
            'acdh:hasCollectedStartDate' => 'Start of data collection',
            'acdh:hasCollectedEndDate' => 'End of data collection',
            'acdh:hasAppliedMethod' => 'Methods',
            'acdh:hasAppliedMethodDescription' => 'Methods description',
            'acdh:hasLifeCycleStatus' => 'Life Cycle Status'
        ];

        foreach ($props as $k => $v) {
            if (isset($this->properties[$k])) {
                if (is_array($this->properties[$k])) {
                    foreach ($this->properties[$k] as $val) {
                        if (isset($val['value'])) {
                            $result[$v][] = $val;
                        }
                    }
                }
            }
        }
        return $result;
    }

    public function getFundingData(): array {
        $result = [];
        $props = [
            'acdh:hasFunder' => 'Funding',
            'acdh:hasNonLinkedIdentifier' => 'Project number'
        ];

        foreach ($props as $k => $v) {
            if (isset($this->properties[$k])) {
                if (is_array($this->properties[$k])) {
                    foreach ($this->properties[$k] as $val) {
                        if (isset($val['value'])) {
                            $result[$v][] = $val;
                        }
                    }
                }
            }
        }
        return $result;
    }

    /**
     * Return the metadata view right box Size card content
     * @return array
     */
    public function getSizeData(): array {
        $result = [];
        $props = [
            'acdh:hasExtent' => 'Extent',
            'acdh:hasNumberOfItems' => 'Number Of Items',
            'acdh:hasBinarySize' => 'Binary Size'
        ];

        foreach ($props as $k => $v) {
            if (isset($this->properties[$k])) {
                if (is_array($this->properties[$k])) {
                    foreach ($this->properties[$k] as $val) {
                        if (isset($val['value'])) {

                            if ($k === 'acdh:hasBinarySize') {
                                $result[$v][] = $this->formatBytes($val['value']);
                            } else {
                                $result[$v][] = $val['value'];
                            }
                        }
                    }
                }
            }
        }
        return $result;
    }

    /**
     * Place view Address section
     * @return array
     */
    public function getPlaceAddress(): array {
        $result = [];
        $props = [
            'acdh:hasAddressLine1' => 'Address Line 1',
            'acdh:hasAddressLine2 ' => 'Address Line 2',
            'acdh:hasPostcode' => 'Postcode',
            'acdh:hasCity' => 'City',
            'acdh:hasRegion' => 'Region',
            'acdh:hasCountry' => 'Country',
        ];
        foreach ($props as $k => $v) {
            if (isset($this->properties[$k])) {
                if (is_array($this->properties[$k])) {
                    foreach ($this->properties[$k] as $val) {
                        if (isset($val['value'])) {
                            $result[$v][] = $val;
                        }
                    }
                }
            }
        }
        return $result;
    }

    /**
     * Return the metadata view right box getResMetaTechnicalData card content
     * @return array
     */
    public function getTechnicalData(array $props): array {
        $result = [];
        foreach ($props as $k => $v) {
            if (isset($this->properties[$k])) {
                if (is_array($this->properties[$k])) {
                    $i = 0;
                    foreach ($this->properties[$k] as $val) {

                        if (isset($val['value'])) {
                            $result[$v][$i]['id'] = $val['id'];
                            $result[$v][$i]['type'] = $val['type'];
                            if ($k === 'acdh:hasBinarySize') {
                                $result[$v][$i]['title'] = $this->formatBytes($val['value']);
                            } else {
                                $result[$v][$i]['title'] = $val['value'];
                            }
                        }
                    }
                }
            }
        }

        return $result;
    }

    /**
     * Check if we have to display the version box
     * @return bool
     */
    public function hasVersion(): bool {
        if (isset($this->properties['acdh:hasVersion'])) {
            return true;
        }
        return false;
    }

    private function formatBytes($bytes, $precision = 2) {
        $units = array('B', 'KB', 'MB', 'GB', 'TB');

        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);

        $bytes /= pow(1024, $pow);

        return round($bytes, $precision) . ' ' . $units[$pow];
    }

    /**
     * Providing the Concept and ConceptScheme identifier
     * @return string
     */
    public function isConceptOrConceptScheme(): string {
        if ($this->getAcdhType() === 'Concept' or $this->getAcdhType() === 'ConceptScheme') {
            $identifiers = $this->getConceptAndSchemeIdentifiers();
            if (count($identifiers) > 0) {
                if (isset($identifiers[0]['value'])) {
                    return $identifiers[0]['value'];
                }
            }
        }
        return "";
    }
}
