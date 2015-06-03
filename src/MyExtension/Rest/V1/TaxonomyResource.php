<?php
/**
 * Rubedo -- ECM solution
 * Copyright (c) 2014, WebTales (http://www.webtales.fr/).
 * All rights reserved.
 * licensing@webtales.fr
 *
 * Open Source License
 * ------------------------------------------------------------------------------------------
 * Rubedo is licensed under the terms of the Open Source GPL 3.0 license.
 *
 * @category   Rubedo
 * @package    Rubedo
 * @copyright  Copyright (c) 2012-2014 WebTales (http://www.webtales.fr)
 * @license    http://www.gnu.org/licenses/gpl.html Open Source GPL 3.0 license
 */

namespace RubedoAPI\Rest\V1;

use Rubedo\Services\Manager;
use RubedoAPI\Entities\API\Definition\FilterDefinitionEntity;
use RubedoAPI\Entities\API\Definition\VerbDefinitionEntity;
use Zend\Json\Json;


/**
 * Class SearchResource
 * @package RubedoAPI\Rest\V1
 */
class TaxonomyResource extends AbstractResource
{

    /**
     * @var string
     */
    protected $searchOption;
    /**
     * @var array
     */
    protected $searchParamsArray;

    /**
     * {@inheritdoc}
     */
    public function __construct()
    {
        parent::__construct();
        $this->searchOption = 'all';
        $this->searchParamsArray = array('orderby', 'orderbyDirection', 'query', 'objectType', 'type', 'damType', 'userType', 'author',
            'userName', 'lastupdatetime', 'start', 'limit', 'searchMode');
        $this
            ->definition
            ->setName('Search')
            ->setDescription('Search with ElasticSearch')
            ->editVerb('get', function (VerbDefinitionEntity &$entity) {
                $entity
                    ->setDescription('Get a list of media using Elastic Search')
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('siteId')
                            ->setRequired()
                            ->setDescription('Id of the site')
                            ->setFilter('\\MongoId')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('pageId')
                            ->setRequired()
                            ->setDescription('Id of the page')
                            ->setFilter('\\MongoId')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('orderbyDirection')
                            ->setDescription('Sort parameter, must be \'asc\' or \'desc\'')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('orderby')
                            ->setDescription('Orderby parameter')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('type')
                            ->setDescription('Content Type array')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('damType')
                            ->setDescription('Dam Type array')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('objectType')
                            ->setDescription('Object Type array')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('userType')
                            ->setDescription('User Type array')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('author')
                            ->setDescription('Author')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('userName')
                            ->setDescription('Username')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('taxonomies')
                            ->setDescription('Taxonomies Array')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('lastupdatetime')
                            ->setDescription('Last update time')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('detailPageId')
                            ->setDescription('Id of the linked page')
                            ->setFilter('\\MongoId')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('query')
                            ->setDescription('Query parameter')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('predefinedFacets')
                            ->setDescription('Json array facets')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('displayedFacets')
                            ->setDescription('Json array displayed facets')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('displayMode')
                            ->setDescription('Display Mode')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('siteId')
                            ->setDescription('Id of the site')
                            ->setFilter('\\MongoId')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('profilePageId')
                            ->setDescription('Id of the profile page')
                            ->setFilter('\\MongoId')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('constrainToSite')
                            ->setDescription('Property to constrain to the site given with siteId')
                            ->setFilter('boolean')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('start')
                            ->setDescription('Item\'s index number to start')
                            ->setFilter('int')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('limit')
                            ->setDescription('How much contents to return')
                            ->setFilter('int')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('searchMode')
                            ->setDescription('Search mode : default, count or aggregate')
                    )
                    ->addOutputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('results')
                            ->setDescription('List of result return by the research')
                    )
                    ->addOutputFilter(
                        (new FilterDefinitionEntity())
                            ->setKey('count')
                            ->setDescription('Number of results return by the research')
                    );
            });
    }

    /**
     * Get action
     * @param $queryParams
     * @return array
     */
    public function getAction($queryParams)
    {
        $params = $this->initParams($queryParams);
        
        $taxonomyService = Manager::getService('Taxonomy');
        $taxonomies={};
        foreach($paramsId in $params) {
            $taxonomies[$paramsId]=$taxonomyService->findByContentTypeID($paramsId);
        }

        return [
            'success' => true,
            'results' => $taxonomies,
            'count' => $results['total']
        ];

    }

    /**
     * init params
     *
     * @param $queryParams
     * @return array
     */
    protected function initParams($queryParams)
    {
        $blockConfigArray = array('displayMode', 'displayedFacets');

        foreach ($queryParams as $keyQueryParams => $param) {
            if ($keyQueryParams == 'contentId') {
                $taxonomies = JSON::decode($param);
                foreach ($taxonomies as $taxonomy => $verbs) {
                    $params[$taxonomy] = $verbs;
                }
            }
        }
        return $params;
    }

    /**
     * Parse predefined facets
     *
     * @param $params
     * @param $queryParams
     */
    protected function parsePrefedinedFacets(&$params, $queryParams)
    {
        $predefParamsArray = Json::decode($queryParams['predefinedFacets'], Json::TYPE_ARRAY);
        if (is_array($predefParamsArray)) {
            if (isset($predefParamsArray['query']) && isset($queryParams['query']) && $predefParamsArray['query'] != $queryParams['query']) {
                $inter = $predefParamsArray['query'] . ' ' . $queryParams['query'];
                $predefParamsArray['query'] = $inter;
                $queryParams['query'] = $inter;
            }
            foreach ($predefParamsArray as $key => $value) {
                $params[$key] = $value;
            }
        }
    }

 }