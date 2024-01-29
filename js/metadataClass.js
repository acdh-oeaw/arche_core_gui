(function ($) {

    $.fn.MetadataClass = function (dataSet) {
        
    var thumbUrl = 'https://arche-thumbnails.acdh.oeaw.ac.at/';
    var biblatexUrl = 'https://arche-biblatex.acdh.oeaw.ac.at/';
    var audioCategories = ['audio', 'sound', 'speechrecording', 'speech'];
    var publicAccessValue = 'https://vocabs.acdh.oeaw.ac.at/archeaccessrestrictions/public';
    var publicAccessTitle = ['public', 'öffentlich'];
    
        
    // Your class methods go here
    var data = dataSet.data;
    
    this.getData = function (property) {
        return data[property] ? data[property] : [] ; 
    }
    
    
    
    this.getAvailableDate = function () {
        return data["acdh:hasAvailableDate"] && data["acdh:hasAvailableDate"][0] && data["acdh:hasAvailableDate"][0].value !== undefined ? data["acdh:hasAvailableDate"][0].value : "";
    }
    
    this.getTitle = function () {
        return data["acdh:hasTitle"] && data["acdh:hasTitle"][0] && data["acdh:hasTitle"][0].value !== undefined ? data["acdh:hasTitle"][0].value : "";
    }
    
    this.getType = function () {
        return data["rdf:type"] && data["rdf:type"][0] && data["rdf:type"][0].value !== undefined ? data["rdf:type"][0].value : "";
    }
    
    this.getIdentifiers = function () {
        return data["acdh:hasIdentifier"] ? data["acdh:hasIdentifier"] : [];
    }
    
    this.getNonAcdhIdentifiers = function () {
        var result = [];
        if(data["acdh:hasIdentifier"]) {
            
        }
        return result;
    }
    
    /**
     * 
    
        
    public function getNonAcdhIdentifiers(): array
    {
        $result = array();
        if (isset($this->properties["acdh:hasIdentifier"]) && !empty($this->properties["acdh:hasIdentifier"])) {
            foreach ($this->properties["acdh:hasIdentifier"] as $k => $v) {
                //filter out the baseurl related identifiers and which contains the id.acdh
                if ((strpos($v->value, $this->config->getBaseUrl()) === false) &&
                        (strpos($v->value, 'https://id.acdh.oeaw.ac.at') === false)
                ) {
                    $result[] = $v;
                }
            }
        }
        return $result;
    }
    
    public function getNonAcdhApiIdentifiers(): array
    {
        $result = array();
        if (isset($this->properties["acdh:hasIdentifier"]) && !empty($this->properties["acdh:hasIdentifier"])) {
            foreach ($this->properties["acdh:hasIdentifier"] as $k => $v) {
                //filter out the baseurl related identifiers
                if ((strpos($v->value, $this->config->getBaseUrl()) === false)) {
                    $result[] = $v;
                }
            }
        }
        return $result;
    }

    public function getPid(): string
    {
        return (
                isset($this->properties["acdh:hasPid"][0]->value) && !empty($this->properties["acdh:hasPid"][0]->value) && (
                    (strpos($this->properties["acdh:hasPid"][0]->value, 'http://') !== false) ||
                (strpos($this->properties["acdh:hasPid"][0]->value, 'https://') !== false)
                )
                ) ? $this->properties["acdh:hasPid"][0]->value : "";
    }

 
    public function getInsideUrl(): string
    {
        if (isset($this->properties["acdh:hasIdentifier"])) {
            foreach ($this->properties["acdh:hasIdentifier"] as $v) {
                if (isset($v->acdhid) && !empty($v->acdhid)) {
                    return str_replace('https://', '', $v->acdhid);
                }
            }
        }
        return "";
    }    
     
     
     public function getUUID(): string
    {
        if (isset($this->properties["acdh:hasIdentifier"])) {
            foreach ($this->properties["acdh:hasIdentifier"] as $v) {
                if (isset($v->acdhid) && !empty($v->acdhid)) {
                    return $v->acdhid;
                }
            }
        }
        return "";
    }
 public function getAcdhID(): string
    {
        if (isset($this->properties["acdh:hasIdentifier"])) {
            foreach ($this->properties["acdh:hasIdentifier"] as $v) {
                if (strpos($v->value, '/id.acdh.oeaw.ac.at/') !== false &&
                        strpos($v->value, '/id.acdh.oeaw.ac.at/cmdi/') === false) {
                    return $v->value;
                }
            }
        }
        return "";
    }

public function getRepoUrl(): string
    {
        if (!isset($this->repoid) && empty($this->repoid)) {
            $this->getRepoID();
        }
        return $this->config->getBaseUrl() . $this->repoid;
    }

     
     
     public function getBiblatexUrl(): string
    {
        return $this->biblatexUrl . '?id=' . $this->getRepoUrl() . '&lang=' . $this->language;
    }
  
    public function getRepoGuiUrl(): string
    {
        if (!isset($this->repoid) && empty($this->repoid)) {
            $this->getRepoID();
        }
        return str_replace('/api/', '/browser/detail/', $this->config->getBaseUrl()) . $this->repoid;
    }

   
    public function getRepoID(): string
    {
        if (isset($this->properties["acdh:hasIdentifier"])) {
            foreach ($this->properties["acdh:hasIdentifier"] as $v) {
                if (isset($v->id) && !empty($v->id)) {
                    $this->repoid = $v->id;
                    return $v->id;
                } else {
                    if (strpos($v->value, $this->config->getBaseUrl()) !== false) {
                        $this->repoid = str_replace($this->config->getBaseUrl(), '', $v->value);
                        return str_replace($this->config->getBaseUrl(), '', $v->value);
                    }
                }
            }
        }
        return "";
    }

  
    public function getAccessRestriction(): array
    {
        $result = array();
        if (isset($this->properties["acdh:hasAccessRestriction"])) {
            foreach ($this->properties["acdh:hasAccessRestriction"] as $v) {
                if (isset($v->title) && !empty($v->title)) {
                    $result['title'] = $v->title;
                } elseif (isset($v->value) && !empty($v->value)) {
                    $result['title'] = $v->value;
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

    public function getTitleImage(string $width = '200px'): string
    {
        $img = '';
        $width = str_replace('px', '', $width);
        //check the thumbnail service first
        if ($this->getAcdhID()) {
            $acdhid = str_replace('https://', '', str_replace('http://', '', $this->getAcdhID()));
            if ($file = @fopen($this->thumbUrl . $acdhid, "r")) {
                $type = fgets($file, 40);
                if (!empty($type)) {
                    $img = $this->thumbUrl . $acdhid . '?width=' . $width;
                    return '<img src="' . $img . '" class="img-responsive">';
                }
            }
        }
        return '';
    }


    public function getTitleImageUrl(string $width = '200px'): string
    {
        $img = '';
        $imgBinary = '';
        $width = str_replace('px', '', $width);
        //check the thumbnail service first
        if ($acdhid = $this->getAcdhID()) {
            $acdhid = str_replace('http://', '', $acdhid);
            $acdhid = str_replace('https://', '', $acdhid);
            if ($file = @fopen($this->thumbUrl . $acdhid, "r")) {
                $type = fgets($file, 40);
                if (!empty($type)) {
                    return $this->thumbUrl . $acdhid . '?width=' . $width;
                }
            }
        }
        return '';
    }


    public function isTitleImage(): bool
    {
        if (!empty($this->getAcdhID())) {
            return true;
        }
        return false;
    }


    public function getAcdhType(): string
    {
        if (isset($this->properties["rdf:type"])) {
            foreach ($this->properties["rdf:type"] as $v) {
                if (isset($v->title) && !empty($v->title) && (strpos($v->title, 'https://vocabs.acdh.oeaw.ac.at/schema#') !== false)) {
                    return str_replace('https://vocabs.acdh.oeaw.ac.at/schema#', '', $v->title);
                } elseif (isset($v->value) && !empty($v->value) && (strpos($v->value, 'https://vocabs.acdh.oeaw.ac.at/schema#') !== false)) {
                    return str_replace('https://vocabs.acdh.oeaw.ac.at/schema#', '', $v->value);
                }
            }
        }
        return "";
    }

 
    public function getRdfTypes(): array
    {
        $result = array();
        if (isset($this->properties["rdf:type"])) {
            foreach ($this->properties["rdf:type"] as $v) {
                if (isset($v->title) && !empty($v->title) && (strpos($v->title, 'https://vocabs.acdh.oeaw.ac.at/schema#') !== false)) {
                    $result[] = Helper::createShortcut($v->title);
                } elseif (isset($v->value) && !empty($v->value) && (strpos($v->value, 'https://vocabs.acdh.oeaw.ac.at/schema#') !== false)) {
                    $result[] = Helper::createShortcut($v->value);
                }
            }
        }
        return $result;
    }

    public function getSkosType(): string
    {
        if (isset($this->properties["rdf:type"])) {
            foreach ($this->properties["rdf:type"] as $v) {
                if (isset($v->title) && !empty($v->title) && (strpos($v->title, 'http://www.w3.org/2004/02/skos/core#') !== false)) {
                    return str_replace('http://www.w3.org/2004/02/skos/core#', '', $v->title);
                } elseif (isset($v->title) && !empty($v->value) && (strpos($v->value, 'http://www.w3.org/2004/02/skos/core#') !== false)) {
                    return str_replace('http://www.w3.org/2004/02/skos/core#', '', $v->value);
                }
            }
        }
        return "";
    }


    public function getExpertTableData(): array
    {
        return $this->properties;
    }


    public function getFormattedDateByProperty(string $property, string $dateFormat = 'Y'): string
    {
        if (isset($this->properties[$property])) {
            if (isset($this->properties[$property][0]->value)) {
                $val = strtotime($this->properties[$property][0]->value);
                return date($dateFormat, $val);
            }
        }
        return '';
    }

    public function getCopyResourceLink(): string
    {
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

    public function getMultiPolygonFirstCoordinate(): string
    {
        $str = "";
        if (isset($this->properties["acdh:hasWKT"][0]->title) && !empty($this->properties["acdh:hasWKT"][0]->title)) {
            $data = array_filter(explode(" ", $this->checkMultiPolygonMapString()));
            $first_coordinate = array_slice($data, 0, 2);
            $str = "[" . $first_coordinate[1] . " " . $first_coordinate[0] . "]";
        }
        return $str;
    }

 
    public function getPolygonFirstCoordinate(): string
    {
        $str = "";
        if (isset($this->properties["acdh:hasWKT"][0]->title) && !empty($this->properties["acdh:hasWKT"][0]->title)) {
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


    private function checkMultiPolygonMapString(): string
    {
        if (strpos(strtolower($this->properties["acdh:hasWKT"][0]->title), 'multipolygon') !== false) {
            return str_replace(')', '', str_replace('(', '', str_replace('MULTIPOLYGON', '', $this->properties["acdh:hasWKT"][0]->title)));
        } elseif (strpos(strtolower($this->properties["acdh:hasWKT"][0]->title), 'polygon') !== false) {
            return str_replace(')', '', str_replace('(', '', str_replace('POLYGON', '', $this->properties["acdh:hasWKT"][0]->title)));
        }
        return "";
    }

    public function getMapType(): string
    {
        if (isset($this->properties["acdh:hasWKT"][0]->title) && !empty($this->properties["acdh:hasWKT"][0]->title)) {
            if (strpos(strtolower($this->properties["acdh:hasWKT"][0]->title), 'multipolygon') !== false) {
                return 'multipolygon';
            } elseif (strpos(strtolower($this->properties["acdh:hasWKT"][0]->title), 'polygon') !== false) {
                return 'polygon';
            }
        }
        return "";
    }
    public function getPolygonData(): string
    {
        if (isset($this->properties["acdh:hasWKT"][0]->title) && !empty($this->properties["acdh:hasWKT"][0]->title)) {
            if (strpos(strtolower($this->properties["acdh:hasWKT"][0]->title), 'polygon') !== false) {
                $data = str_replace('Polygon', 'MultiPolygon', $this->properties["acdh:hasWKT"][0]->title);
                $data = str_replace('POLYGON', 'MultiPolygon', $this->properties["acdh:hasWKT"][0]->title);
                return $data;
            }
        }
        return "";
    }
    

    public function isAudio(): bool
    {
        $cat = false;
        if (!$this->isPublic()) {
            return false;
        }
        //check the sound categories
        if (isset($this->properties["acdh:hasCategory"])) {
            foreach ($this->properties["acdh:hasCategory"] as $category) {
                if (in_array(strtolower($category->value), (array)$this->audioCategories)) {
                    $cat = true;
                }
            }
        }
        //check the binarysize
        if (isset($this->properties["acdh:hasBinarySize"][0]->value) &&
                (int)$this->properties["acdh:hasBinarySize"][0]->value > 0 &&
                $cat) {
            return true;
        }

        return false;
    }
    

    public function isPDF(): bool
    {
        $isPDF = false;
        if (!$this->isPublic()) {
            return false;
        }
        
        if (isset($this->properties["acdh:hasFormat"])) {
            foreach ($this->properties["acdh:hasFormat"] as $format) {
                if ($format->value == 'application/pdf') {
                    $isPDF = true;
                }
            }
        }
        
        if (isset($this->properties["acdh:hasBinarySize"])) {
            foreach ($this->properties["acdh:hasBinarySize"] as $binary) {
                if ((int)$binary->value > 1 && $isPDF) {
                    return true;
                }
            }
        }
        return false;
    }

    public function isPublic(): bool
    {
        $result = false;
        $access = $this->getAccessRestriction();
        
        if (
                count((array)$access) > 0 &&
                isset($access['vocabsid']) &&
                $access['vocabsid'] = $this->publicAccessValue) {
            $result = true;
        } elseif (count((array)$access) > 0 &&
                isset($access['title']) &&
                in_array($access['title'], $this->publicAccessTitle)) {
            $result = true;
        }
        
        return $result;
    }
    

    public function getVCRData(): string
    {
        $res = new \stdClass();
        
        if (!empty($this->getDataString('acdh:hasDescription'))) {
            $res->description = $this->getDataString('acdh:hasDescription');
        } else {
            if ($this->getAcdhType() == "Resource") {
                $res->description = $this->getDataString('acdh:hasCategory').", ".$this->getDataString('acdh:hasBinarySize');
            } elseif ($this->getAcdhType() == "Collection" || $this->getAcdhType() == "TopCollection") {
                $res->description = $this->getAcdhType().", ".$this->getDataString('acdh:hasNumberOfItems'). ' items';
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

    public function getDataString(string $property): string
    {
        if (isset($this->properties[$property][0]->title) && !empty($this->properties[$property][0]->title)) {
            return $this->properties[$property][0]->title;
        } elseif (isset($this->properties[$property][0]->value) && !empty($this->properties[$property][0]->value)) {
            return $this->properties[$property][0]->value;
        }
        return "";
    }
    
    
    public function isContactDetails(): bool
    {
        $props = ['acdh:hasAddressLine1', 'acdh:hasAddressLine2', 'acdh:Postcode',
            'acdh:hasCity','acdh:hasRegion', 'acdh:hasCountry', 'acdh:hasEmail',
            'acdh:hasUrl'];
        foreach ($props as $p) {
            if (isset($this->properties[$p])) {
                return true;
            }
        }
        return false;
    }
}

*/

    return this; // Allow chaining
  };
    
})(jQuery);