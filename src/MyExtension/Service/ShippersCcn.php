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
namespace Rubedo\Collection;

use Rubedo\Interfaces\Collection\IShippers;
use Rubedo\Services\Manager;

/**
 * Service to handle Shippers
 *
 * @author adobre
 * @category Rubedo
 * @package Rubedo
 */
class ShippersCcn extends AbstractCollection implements IShippers
{
    public function __construct()
    {
        $this->_collectionName = 'Shippers';
        parent::__construct();
    }

    /**
     * @see \Rubedo\Interfaces\Collection\IShippers::getApplicableShippers
     */
    public function getApplicableShippers($country, $myCart)
    {
        $pipeline = array();
        $pipeline[] = array(
            '$project' => array(
                'shipperId' => '$_id',
                '_id' => 0,
                'name' => '$name',
                'rateType' => '$rateType',
                'rates' => '$rates'
            )
        );
        $pipeline[] = array(
            '$unwind' => '$rates'
        );
        $pipeline[] = array(
            '$match' => array(
                'rates.country' => array(
                    '$in' => array($country)
                )
            )
        );
        $response = $this->_dataService->aggregate($pipeline);
        if ($response['ok']) {
            $itemNumber=0;
            $cartWeight = 0;
            foreach ($myCart as $value) {
                $itemNumber = $itemNumber + $value['amount'];
            }
            foreach ($response['result'] as &$value) {
                $value['shipperId'] = (string)$value['shipperId'];
                $value = array_merge($value, $value['rates']);
                unset ($value['rates']);
                if ($value['rateType'] == 'flatPerItem') {
                    $contentsService = Manager::getService("Contents");
                    /*flatperitem -> calculer la taxe au poids !*/
                    foreach($myCart as $value) {
                        //$content = $contentsService->findById($value['productId']['$id'], true, false);
                        //if($content['fields']['weight']) $cartWeight += $content['fields']['number'];
                    }
                    $value['rate'] = $value['rate'] * $cartWeight;
                }
            }
            return array(
                "data" => $response['result'],
                "total" => count($response['result']),
                "success" => true
            );
        } else {
            return array(
                "msg" => $response['errmsg'],
                "success" => false
            );
        }
    }

    /**
     * Find by ID and merge current country at root of array
     *
     * @param $id
     * @param $country
     * @return array
     *
     * @see \Rubedo\Interfaces\Collection\IShippers::findByIdAndWindApplicable
     */
    public function findByIdAndWindApplicable($id, $country)
    {
        $finded = $this->findById($id);
        foreach ($finded['rates'] as $rate) {
            if ($rate['country'] == $country) {
                $finded = array_merge($finded, $rate);
            }
        }
        return $finded;
    }
}
