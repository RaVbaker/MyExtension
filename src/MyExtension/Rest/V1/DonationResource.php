<?php
namespace RubedoAPI\Rest\V1;
use Rubedo\Collection\AbstractCollection;
use Rubedo\Services\Manager;
use RubedoAPI\Entities\API\Definition\FilterDefinitionEntity;
use RubedoAPI\Entities\API\Definition\VerbDefinitionEntity;

class DonationResource extends AbstractResource
{
    /**
     * native config for this payment means
     *
     * @var array
     */
    public function __construct()
    {
        parent::__construct();
        $this->define();
    }    
    
    
    
    
    public function postAction($params)
    {
        $arrayToReturn=[];
        $donationInfo =$params["don"];
        $accountInfos = $params["account"];
        $don=[];
        $don['fields'] =  $donationInfo;
        
        $id = "5722355ac445ec68568bf3ba"; // id du contenu "Numéro de dons"
        //get numero de dons
        $wasFiltered = AbstractCollection::disableUserFilter(true);
        $contentsService = Manager::getService("ContentsCcn");
        $content = $contentsService->findById($id,false,false);
        //update numero incrémenté
       $content['i18n'] = array(
            $params['lang']->getLocale() =>array(
                "fields" => array("text"=>$content["fields"]["text"])
            )
        );
        $donationNumber = $content["fields"]["value"];
        $content["fields"]["value"] += 1; //add 1
        $result = $contentsService->update($content, array(),false);
        
        // on récupére les infos du compte
        $paymentConfigPays=Manager::getService("PaymentConfigs")->getConfigForPM($accountInfos["config_pays"]);
        $paymentConfigInt=Manager::getService("PaymentConfigs")->getConfigForPM($accountInfos["config_hors_pays"]);
        
        //récupérer les infos spécifique au projet : budget, montant payé, contact
        $projectDetail = $contentsService->findById($don["fields"]["projetId"],false,false);
        //déterminer si le projet est un projet national ou hors pays / international
        $isProjetInternational = true;
        if($paymentConfigPays["data"]["nativePMConfig"]["taxo_pays"]){
            //taxonomie du pays du site
            $taxoPays = (array) json_decode($paymentConfigPays["data"]["nativePMConfig"]["taxo_pays"], true);
            foreach ($taxoPays as $vocabulary => $taxonomy){
                //si le projet a la taxonomie de pays et qu'elle vaut le pays concerné, alors on prend la config du pays
                if (array_key_exists($vocabulary, $projectDetail["taxonomy"])) {
                    if($projectDetail["taxonomy"][$vocabulary][0] == $taxonomy) {
                        $isProjetInternational = false;
                    }
                }
            }
        };
        
        
        
        
        // create don
        $don['fields']["condition"] = $accountInfos["text"];
        $don['fields']["justificatif"] = $accountInfos["recu"];
        $don['fields']['isInternational'] = $isProjetInternational; 
        $don['fields'] = $this->processDon($don['fields']);
        $don['fields']['text'] = $this->getPays() . "_" . date("Y") . "_" . str_pad($donationNumber, 6, '0', STR_PAD_LEFT); ;
        $don['text'] =$don['fields']['text'] ;
        $don['writeWorkspace'] = "57237282c445ecf3008c7ddc";
        $don['target'] = "57237282c445ecf3008c7ddc";
        $don['typeId'] = "5652dcb945205e0d726d6caf";
        $don['i18n'] = array(
            $params['lang']->getLocale() => array(
                "fields" => array(
                    "text"=>$don['fields']['text'] 
                )
            )
        );
        $don['status'] = 'published';
        $don['online'] = true;
        $don['startPublicationDate'] = ""; $don['endPublicationDate'] = "";
        $don['nativeLanguage'] = $params['lang']->getLocale();
        $resultcreate = $contentsService->create($don, array(),false);                
        AbstractCollection::disableUserFilter(false);
        
        
        
        //si payement par carte (Paybox) alors on envoie un mail au responsable international des dons et on procède au payement
        if($don["fields"]["modePaiement"]=="carte") {
            $payboxAccountName ="";
            if($isProjetInternational) {
                $this->envoyerMailsDon($don["fields"],$projectDetail,$paymentConfigInt["data"],$params['lang']->getLocale(),true);
                $payboxAccountName = $accountInfos["config_hors_pays"];
            }
            else {
                $this->envoyerMailsDon($don["fields"],$projectDetail,$paymentConfigPays["data"],$params['lang']->getLocale(),true);
                $payboxAccountName = $accountInfos["config_pays"];
            }

            $arrayToReturn = array("whatToDo" =>"proceedToPayment", "id" =>$don['fields']['text'], "accountName" => $payboxAccountName );
            
        }
        else {
            if($isProjetInternational) {
                $this->envoyerMailsDon($don["fields"],$projectDetail,$paymentConfigInt["data"],$params['lang']->getLocale());
            }
            else {
                $this->envoyerMailsDon($don["fields"],$projectDetail,$paymentConfigPays["data"],$params['lang']->getLocale());
            }
            $arrayToReturn = array("whatToDo" =>"displayRichText", "id" =>$don['fields']['text'] );
        }
        

        
        return array('success' =>true, 'instructions' =>$arrayToReturn);
        
   }
   

   
   
    public function getAction($params) {
        $securite = true; $autorisation = false;$erreurStatus = true; $erreurMessage="";
        //VERIFICATIONS PAYBOX
        //code d'erreur
        if($params['erreur'] == "00000") $erreurStatus = false;
        //else $erreurMessage = $this->getErrorMessage($params['erreur']);
          
        //autorisation
        if($params['autorisation'] && $params['autorisation']!="") $autorisation = true;
        else $erreurMessage .= " Pas d'autorisation de Paybox. ";
        
        
        if(!($erreurStatus) && $securite && $autorisation) {
            $commande = explode("|", $params['commande']); // $codeAna . "|" .$idInscription . "|" . $proposition . "|" . $prenom . "|" . $nom . "|" . $email; 
            $codeAna = $commande[0];
            $idDonation = $commande[1];
 
            
        }
        /*Récupérer le contenu dons correspondant*/
        $wasFiltered = AbstractCollection::disableUserFilter(true);
        $this->_dataService = Manager::getService('MongoDataAccess');
        $this->_dataService->init("Contents");
        $don = $this->_dataService->findByName($idDonation);
        /*Récupérer le contenu projet correspondant*/
        $contentsService = Manager::getService("ContentsCcn");
        $projectDetail = $contentsService->findById($don["live"]["fields"]["projetId"],false,false);
        /*Récupérer le contenu config de dons correspondant*/
        $conditionFiscale = $contentsService->findById($don["live"]["fields"]["conditionId"],false,false);
        AbstractCollection::disableUserFilter(false);
        /*récupérer les infos du compte*/
        if($don["fields"]["isInternational"]) {
            $paymentConfig = Manager::getService("PaymentConfigs")->getConfigForPM($conditionFiscale["fields"]["config_hors_pays"]);
        }
        else {
            $paymentConfig = Manager::getService("PaymentConfigs")->getConfigForPM($conditionFiscale["fields"]["config_pays"]);
        }
        
        /*ajouter le titre du don*/        
        $don["live"]["fields"]["text"] = $don["text"];

        /*mettre à jour le statut de payement dans le contenu don*/
        if($don["live"]["fields"]["montant"]*100 == $params['montant']) {
            $don["live"]["fields"]["etat"] = "paiement_carte_valide";
            $don["live"]["version"] = 2;
            $wasFiltered = AbstractCollection::disableUserFilter(true);
            //récupérer le contenu don avec le bon format :-)
            $contentToUpdate = $contentsService->findById($don["id"],false,false);
            $contentToUpdate["i18n"] = $don["live"]["i18n"];
            $contentToUpdate["fields"]["etat"]="paiement_carte_valide";
            //$contentToUpdate["version"] = 2;
        //update numero incrémenté
            $result = $contentsService->update($contentToUpdate, array(),false);            
            AbstractCollection::disableUserFilter(false);

        }
        else {
            //ajouter un message d'erreur ?
        }

        $this->envoyerMailsDon($contentToUpdate["fields"],$projectDetail,$paymentConfig["data"],$don['live']['nativeLanguage']);
        return [
                'success' => true,
                'result' => $result
            ];
    }
       
 
   /*fonction pour préparer l"inscription du don*/
    protected function processDon($donationInfo) {
        // date du paiement
        $donationInfo["datePaiement"] =  strtotime(date("c"));
        foreach($donationInfo["user"] as $key => $value) {
            $donationInfo[$key] = $value;
        }
        if($donationInfo["birthdate"]) $donationInfo["birthdate"] = strtotime($donationInfo["birthdate"]);
        if($donationInfo["trimestriel"]) $donationInfo["frequence"] = "Trimestriel";
        if($donationInfo["mensuel"]) $donationInfo["frequence"] = "Mensuel";
        if($donationInfo["montant"]=='autre') $donationInfo["montant"] = $donationInfo["montant_autre"];
        return $donationInfo;
    }
   
   
   protected function envoyerMailsDon($don,$projectDetail,$configPaymentData,$lang,$responsableInternationalSeulement) {
        $configPayment = $configPaymentData["nativePMConfig"];
        $trad = json_decode(file_get_contents('http://' . $_SERVER['HTTP_HOST'] .'/theme/cte/elements/'.$lang.'.json'),true);
        $infoPaiementAdmin="";
        //contact du projet
        $contactProjet = array("nom" => $projectDetail["fields"]["nom"],
                               "titre" => $projectDetail["fields"]["contactTitle"],
                               "email" =>$projectDetail["fields"]["email"]);
        //contact national défini dans la configuration de payement du pays (et pas forcément celle choisie par le donateur!)
        //$contactNational = $don["contactNational"];
        $paymentMeansPays=Manager::getService("PaymentConfigs")->getConfigForPM($this->getConfigPays());

        $contactNationalDonsId = $paymentMeansPays["data"]["nativePMConfig"]["contactDonsId"];
        $wasFiltered = AbstractCollection::disableUserFilter(true);
        //récupérer le contenu contact national
        $contentsService = Manager::getService("ContentsCcn");
        $contentContactNational = $contentsService->findById($contactNationalDonsId,false,false);
        AbstractCollection::disableUserFilter(false);
        $contactNational = $contentContactNational["fields"];
        $emailResponsableInternationalDons = "partage@chemin-neuf.org";
        //sujetDonateur = "Votre don à la Communauté du Chemin Neuf - " + idDonation
        $sujetDonateur = $trad["ccn_don_7"] . " - " . $don["text"];
        $messageDonateur = "";
        $messageDonateur .= "<p>".$trad["ccn_label_". $don["civilite"]] . " ". $don["surname"] . " ". $don["nom"] . ", <br/><br/>";
        //sujet admininistrateur
        $sujetAdmin= $trad["ccn_don"] . " " . $don["text"] . " - " . $don["montantAvecFrequence"] ." - " . $don["nom"] . " - " . $don["modePaiement"] . " - " . $don["projet"];

        //messageDonateur += "Nous vous remercions pour votre don de ${montantAvecMonnaieEtFrequence} pour soutenir le projet ${projet}."
        $messageDonateur .= $this->translate($trad["ccn_don_1"],['%montantAvecMonnaieEtFrequence%','%projet%'],[$don["montantAvecFrequence"],$don["projet"]]) . ".<br/><br/>";
   
        //paiement par chèque
        if($don["modePaiement"]=="cheque") {
            //"Merci de nous faire parvenir votre chèque à l'ordre de ${ordre-cheque} à l'adresse suivante: ${adresse-cheque}."
            $messageDonateur.=$trad["ccn_don_2"] . "<em>" . $configPayment["libelle_cheque"] . "</em> " . $trad["ccn_don_2_bis"]. " : <br/>". $configPayment["adresse"] . "<br/><br/>";
            //Votre don a été enregistré sous le numéro « FR2012/12539 ».
            $messageDonateur .= $this->translate($trad["ccn_don_3"],'%numero%', $don["text"])  .". ";
            //Merci de reporter ce numéro au dos de votre chèque.
            $messageDonateur .= $trad["ccn_don_8"] ."<br/><br/>";
            //Après encaissement du chèque, nous vous enverrons un reçu fiscal.
            if($don["justificatif"]) 
                $messageDonateur .= $trad["ccn_don_4"] ."<br/><br/>";
            
            $infoPaiementAdmin .= $this->addLine($trad["ccn_label_mode_paiement"], $trad["ccn_paiement_par_cheque"]);
            $infoPaiementAdmin .= $this->addLine($trad["ccn_ordre_du_cheque"], $configPayment["libelle_cheque"]);
            $infoPaiementAdmin .= $this->addLine($trad["ccn_adresse_cheque"], $configPayment["adresse"]);
        }
        else if($don["modePaiement"]=="virement" || $don["modePaiement"]=="virementPeriod") {
            //Vous devez vous connecter à votre service en ligne de votre banque et effectuer un virement sur le compte '${compte} dont l'intitulé est '${intitule}.
            //$messageDonateur.=$trad["ccn_don_15"] . ":<br>" . $configPayment["coordonnes_compte"] . "</br> " . $trad["ccn_don_15_bis"]. " : <br/>". $configPayment["nom_compte"] . "<br/><br/>";
            
            $messageDonateur.= $this->translate($trad["ccn_don_15"],['%coordonnes_compte%','%nom_compte%'],[$configPayment["coordonnes_compte"], $configPayment["nom_compte"]]). "<br/><br/>";
            
            if($configPayment["image_rib"])
                $messageDonateur .= "<center><img src='http://" . $_SERVER['HTTP_HOST']  . "/dam?media-id=" . $configPayment["image_rib"] . "&width=300px'></center><br/>";
            //Votre don a été enregistré sous le numéro « FR2012/12539 ».
            $messageDonateur .= $this->translate($trad["ccn_don_3"],'%numero%', $don["text"])  .". ";
            //Merci de reporter ce numero dans le champ 'commentaire' ou 'remarque' de votre virement bancaire.
            $messageDonateur .= $trad["ccn_don_16"] .".<br/><br/>";
            
            if($don["modePaiement"]=="virement") {
                if($don["justificatif"]) {
                    //Après encaissement du versement, nous vous enverrons un reçu fiscal.
                    $messageDonateur .= $trad["ccn_don_14"] ."<br/><br/>";
                }   
                $infoPaiementAdmin .= $this->addLine($trad["ccn_label_mode_paiement"], $trad["ccn_paiement_par_virement"]);
            }
            else if($don["modePaiement"]=="virementPeriod") {
                 if($don["justificatif"]) {
                    //Au début de chaque année, nous vous enverrons un reçu fiscal
                    $messageDonateur .= $trad["ccn_don_20"] ."<br/><br/>";
                }   
                $infoPaiementAdmin .= $this->addLine($trad["ccn_label_mode_paiement"], $trad["ccn_paiement_par_virement_periodique"]);
            }
            $infoPaiementAdmin .= $this->addLine($trad["ccn_intitule_compte"], $configPayment["nom_compte"]);
            $infoPaiementAdmin .= $this->addLine($trad["ccn_coordonnees_compte"], $configPayment["coordonnes_compte"]);

        }
        else if($don["modePaiement"]=="liquide") {
            //messageDonateur += "Merci de déposer ce montant sur le compte '${compte} dont l'intitulé est '${intitule}."
             //$messageDonateur.=$trad["ccn_don_36"] . $configPayment["coordonnes_compte"] . "</br> " . $trad["ccn_don_15_bis"]. " : <br/>". $configPayment["nom_compte"] . "<br/><br/>";
             
            $messageDonateur.= $this->translate($trad["ccn_don_36"],['%coordonnes_compte%','%nom_compte%'],[$configPayment["coordonnes_compte"], $configPayment["nom_compte"]]). "<br/><br/>";

        
            if($configPayment["image_rib"])
                $messageDonateur .= "<center><img src='http://" . $_SERVER['HTTP_HOST']  . "/dam?media-id=" . $configPayment["image_rib"] . "&width=300px'></center><br/>";
            
            //Votre don a été enregistré sous le numéro « FR2012/12539 ».
            $messageDonateur .= $this->translate($trad["ccn_don_3"],'%numero%', $don["text"])  .". ";
            //messageDonateur += "Merci de reporter ce numero dans le champ 'commentaire' ou 'remarque' de votre depot bancaire."
            $messageDonateur .= $trad["ccn_don_37"] . "<br/><br/>";
            
            if($don["justificatif"]) {
                //Après encaissement du versement, nous vous enverrons un reçu fiscal.
                $messageDonateur .= $trad["ccn_don_14"] ."<br/><br/>";
            }              

            $infoPaiementAdmin .= $this->addLine($trad["ccn_label_mode_paiement"], $trad["ccn_paiement_par_liquide"]);
            $infoPaiementAdmin .= $this->addLine($trad["ccn_intitule_compte"], $configPayment["nom_compte"]);
            $infoPaiementAdmin .= $this->addLine($trad["ccn_coordonnees_compte"], $configPayment["coordonnes_compte"]);
                       
        }
        else if($don["modePaiement"]=="prelevement") {
            //Vous devez télécharger et imprimer le formulaire de prélèvement
            $messageDonateur .= $trad["ccn_don_18_part1"];
            $messageDonateur .=  "<a href='http://" . $_SERVER['HTTP_HOST']  . "/dam?media-id=" . $configPayment["form_prevelement"] . "' target='_blank'>" . $trad["ccn_don_18_part2"] ."</a>";
            //, le remplir à la main et le renvoyé, accompagné d'un Relevé d'Identité Bancaire (RIB) à l'adresse suivante:
            $messageDonateur .= $trad["ccn_don_18_part3"] . ":<br/>" . $configPayment["adresse"] . "<br/><br/>";
            //Votre don a été enregistré sous le numéro « FR2012/12539 ».
            $messageDonateur .= $this->translate($trad["ccn_don_3"],'%numero%', $don["text"])  .". ";
            //Merci de reporter ce numero dans le champ 'numéro du don' sur le formulaire de prélèvement.
             $messageDonateur .= $trad["ccn_don_19"] ."<br><br> ";
             if($don["justificatif"]) {
                //Au début de chaque année, nous vous enverrons un reçu fiscal
                $messageDonateur .= $trad["ccn_don_20"] ."<br/><br/>";
            }
            $infoPaiementAdmin .= $this->addLine($trad["ccn_label_mode_paiement"], $trad["ccn_paiement_par_prelevement_auto"]);
            $infoPaiementAdmin .= $this->addLine($trad["ccn_formulaire_de_prelevement"], "<a href='http://" . $_SERVER['HTTP_HOST']  . "/dam?media-id=" . $configPayment["form_prevelement"] . "' target='_blank'>" . $trad["ccn_don_18_part2"] ."</a>");

        }
        else if($don["modePaiement"]=="carte") {
            $infoPaiementAdmin .= $this->addLine($trad["ccn_label_mode_paiement"], $trad["ccn_paiement_par_carte"]);
            /*get paybox account identifiant*/
            $wasFiltered = AbstractCollection::disableUserFilter(true);
            //récupérer le contenu configuration de payment paybox 
            $payboxInfos = $contentsService->findById($configPayment["paybox"],false,false);
            AbstractCollection::disableUserFilter(false);
            
            $infoPaiementAdmin .= $this->addLine($trad["ccn_compte_paybox"], $payboxInfos["fields"]["site"]);
            //Votre don a été enregistré sous le numéro « FR2012/12539 ».
            $messageDonateur .= $this->translate($trad["ccn_don_3"],'%numero%', $don["text"])  .". ";
            //Merci de rappeler ce numéro dans vos correspondances.
            $messageDonateur .= $trad["ccn_don_13"] . "<br/><br/>" ;
            if($don["justificatif"]) {
                //Après encaissement du versement, nous vous enverrons un reçu fiscal.
                $messageDonateur .= $trad["ccn_don_14"] ."<br/><br/>";
            }

        }
        //messageDonateur += "Votre contact pour ce projet est : « prénom et Nom », « responsabilité », Téléphone « +33/(0)6 47 29 05 02 », E-mail « partage@chemin-neuf.org » "
        $messageDonateur.=  $trad["ccn_don_5"]  . "<br/>";
        if($contactProjet["titre"] !="") $messageDonateur .= $contactProjet["titre"] . " - ";
        $messageDonateur.=  $contactProjet["nom"]." - <a href='mailto:" .  $contactProjet['email'] . "'>" . $contactProjet['email'] ."</a><br/><br/>";

        //messageDonateur += "Votre contact pour les questions administratives et fiscales est : « prénom et Nom », « responsabilité », Téléphone « +33/(0)6 47 29 05 02 », E-mail « partage@chemin-neuf.org » "
        $messageDonateur.=  $trad["ccn_don_6"]  . "<br/>";
        $messageDonateur .= $contactNational["prenom"] . " " . $contactNational["nom"] .", " . $contactNational["text"] . " - " . $contactNational["telephone"] . " - <a href='mailto:" .$contactNational["email"]  . "'>" . $contactNational["email"] . "</a><br/><br/>" ;
        
        //Grace à votre don, le projet est maintenant financé à 56%.
        $messageDonateur .= $this->translate($trad["ccn_don_35"],'%percentage%',round(($projectDetail["fields"]["cumul"]+$don["montant"]) *100 / $projectDetail["fields"]["budget"]))  . ".<br/><br/>";
        
        //"Cordialement" + ",<br><br>"
        $messageDonateur .= $trad["ccn_mail_9_vous"] . ",<br><br/>";
        $messageDonateur .= $contactProjet["nom"];
        
        
        
        ///////////////////MESSAGE ADMINISTRATIF////////////////////////////////
        //Don {{n° de don}}
        $messageAdmin = "<h1>" . $trad["ccn_don"] . " " . $don["text"] . "</h1>";
        $messageAdmin .= "<table width=100% style='border: 1px solid #000000' frame='box' rules='all'>";
            ///infos sur le don
        $dateDonation = date("d/m/Y, H:i");
        $messageAdmin .= $this->addLine($trad["ccn_label_date"],$dateDonation);
        $messageAdmin .= $this->addLine($trad["ccn_label_montant"],$don["montantAvecFrequence"] );
        $messageAdmin .= $this->addLine($trad["ccn_label_projet"],$don["projet"] );
        $messageAdmin .= $this->addLine($trad["ccn_label_mode_paiement"],$don["modePaiement"] );
        $messageAdmin .= $this->addLine($trad["ccn_label_statut"],$don["etat"] );
        if($don["justificatif"]) {
            $messageAdmin .= $this->addLine($trad["ccn_label_justificatif_fiscal"],$trad["ccn_oui"] );
        }
        else {
            $messageAdmin .= $this->addLine($trad["ccn_label_justificatif_fiscal"],$trad["ccn_non"] );
        }
        $messageAdmin .= $this->addLine($trad["ccn_label_codeComptable"],$projectDetail["fields"]["codeCompta"] );
        $messageAdmin .= $this->addLine($trad["ccn_label_codeAna"],$projectDetail["fields"]["codeAna"]  );
        $messageAdmin .= $infoPaiementAdmin;
        $messageAdmin .="</table><br/><br/><br/>";
        
        // infos sur le donateur
        $messageAdmin .= "<table width=100% style='border: 1px solid #000000' frame='box' rules='all'>";
        $messageAdmin .= $this->addLine($trad["ccn_label_societe_ou_organisme"],$don["societe"] );
        $messageAdmin .= $this->addLine($trad["ccn_label_civilite"],$trad["ccn_label_". $don["civilite"]] );
        $messageAdmin .= $this->addLine($trad["ccn_label_nom"],$don["nom"] );
        $messageAdmin .= $this->addLine($trad["ccn_label_prenom"],$don["surname"] );
        if ($don["birthdate"]) $messageAdmin .= $this->addLine($trad["ccn_label_dateNaiss"], date("d/m/Y",$don["birthdate"]) );
        $messageAdmin .= $this->addLine($trad["ccn_label_adresse"], $don["adresse"] );
        $messageAdmin .= $this->addLine($trad["ccn_label_codepostal"], $don["cp"] );
        $messageAdmin .= $this->addLine($trad["ccn_label_ville"], $don["city"] );
        $messageAdmin .= $this->addLine($trad["ccn_label_pays"], $don["country"] );
        if($don["tel1"]) $messageAdmin .= $this->addLine($trad["ccn_form_telephone_fixe"], $don["tel1"] );
        if($don["tel2"])  $messageAdmin .= $this->addLine($trad["ccn_form_telephone_portable"], $don["tel2"] );
        $messageAdmin .= $this->addLine($trad["ccn_label_email"], $don["email"] );
        if($don["message"] && $don["message"]!="") $messageAdmin .= $this->addLine($trad["ccn_label_message_joint_au_don"], $don["message"] );
        $messageAdmin .= "</table><br/><br/>";
        
        ///message pour le responsable du projet
        $messageContactProjet = $messageAdmin;
        ///message pour la compta
        //Cette information vous est transmise car vous êtes le contact pour le projet ${projet}. A vous de transmettre cette information à qui de droit. Ce don est versé dans la caisse commune de la communauté.
        $messageContactProjet .= "<br/><br/>" . $this->translate($trad["ccn_don_28"],'%projet%', $don["projet"]) .  ". " . $trad["ccn_don_28_bis"]  ;
        $messageCompta = $messageAdmin;
        
        ///adresses mails
        $emailDonateur = $don["email"];
        $emailComptableNational = $configPayment["email_compta"];
        $emailIntendantNational = $configPayment["email_intendance"];
        $emailResponsableNationalDons = $contactNational["email"];
        
        //mails international
        $paymentConfigInt=Manager::getService("PaymentConfigs")->getConfigForPM("dons_int");
        $emailComptableInternational = $paymentConfigInt["data"]["nativePMConfig"]["email_compta"];
        $emailIntendantGeneral = $paymentConfigInt["data"]["nativePMConfig"]["email_intendance"];
        
        // si mail seulement au resp. International : dans le cas d'un payement en ligne, avant la validation du payement par IPN
        if($responsableInternationalSeulement) {
            $mailerService = Manager::getService('Mailer');
            $mailRespInt = $mailerService->getNewMessage();
            $mailRespInt->setTo($emailResponsableInternationalDons); 
            $mailRespInt->setFrom($emailResponsableInternationalDons);
            $mailRespInt->setSubject($sujetAdmin);
            $mailRespInt->setCharset('utf-8');
            $mailRespInt->setBody($messageAdmin, 'text/html', 'utf-8');
            $mailerService->sendMessage($mailRespInt, $errors);
        }
        else {
            /*ENVOI DU MAIL AU DONATEUR*/
            $mailerService = Manager::getService('Mailer');
            $mailDonateur = $mailerService->getNewMessage();
            $mailDonateur->setTo($emailDonateur);
            //vérifier nom de domaine du mail
            $senderMail = $contactNational['email'];
            $senderDomain = explode("@", $contactNational['email'] );
            if($senderDomain[1] != "chemin-neuf.org"){
                $senderMail = "web@chemin-neuf.org";
            }
            $mailDonateur->setFrom(array( $senderMail => $contactNational["prenom"] . " " . $contactNational["nom"] )); 
            $mailDonateur->setSubject($sujetDonateur);
            $mailDonateur->setCharset('utf-8');
            $mailDonateur->setBody($messageDonateur, 'text/html', 'utf-8');
            $mailerService->sendMessage($mailDonateur, $errors);
            
            /*COPIE DU MESSAGE au resp. international des dons*/
            $mailDonateur -> setTo($emailResponsableInternationalDons);
            $mailerService->sendMessage($mailDonateur);
            
            /*ENVOI DU MAIL AUX ADMINISTRATEURS ET COMPTA*/
            $mailAdmin = $mailerService->getNewMessage();
            $mailAdmin->setFrom(array( $senderMail => $contactNational["prenom"] . " " . $contactNational["nom"] )); 
            $mailAdmin->setSubject($sujetAdmin);
            $mailAdmin->setCharset('utf-8');
            $mailAdmin->setBody($messageContactProjet, 'text/html', 'utf-8');
            
            /*MAIL AU CONTACT DU PROJET*/
            $mailAdmin->setTo($contactProjet["email"]);
            $mailerService->sendMessage($mailAdmin, $errors);
           
           /*signaler les erreurs d'envoi : adresses rejetées*/
            if(sizeof($errors)>0 ) {
                if (in_array($emailDonateur, $errors)) {
                    /*si le mail au donateur a échoué*/
                    $messageAdmin .= "<font color='red'>" + $trad["ccn_don_38"] + "</font>" + "<br><br>";
                    $mailDonateurEchoue = true;
                }
                if (in_array($contactProjet["email"], $errors)) {
                    /*si le mail au contact du projet a échoué*/
                    $messageAdmin .= "<font color='red'>" + $trad["ccn_don_38"] + "</font>" + "<br><br>";
                    $mailContactProjetEchoue = true;
                }
            }
            
            /*MAILS ADMINS*/
            /*si le responsable national n'a pas reçu déjà le mail (ie n'est pas responsable du projet, ou que le mail a échoué*/ 
            if($emailResponsableNationalDons !=$contactProjet["email"] || $mailContactProjetEchoue || $mailDonateurEchoue) {
                $mailAdmin->setTo($emailResponsableNationalDons);
                $mailAdmin->setBody($messageAdmin, 'text/html', 'utf-8');
                $mailerService->sendMessage($mailAdmin);
            }
            /*Responsable international*/
            if( ($emailResponsableInternationalDons != $emailComptableNational) && ($emailResponsableInternationalDons != $emailResponsableNationalDons) && ($emailResponsableInternationalDons != $emailIntendantNational) ) {
                $mailAdmin->setTo($emailResponsableInternationalDons);
            }
            /*MAILS COMPTA*/
            if($emailComptableNational && ($emailComptableNational != $emailResponsableNationalDons) && ($emailComptableNational != $contactProjet["email"])){
                $mailAdmin->setTo($emailComptableNational);
                $mailAdmin->setBody($messageCompta, 'text/html', 'utf-8');
                $mailerService->sendMessage($mailAdmin);
            }
            if($emailIntendantNational && ($emailIntendantNational != $emailResponsableNationalDons) && ($emailIntendantNational != $emailComptableNational) &&($emailIntendantNational != $contactProjet["email"])){
                $mailAdmin->setTo($emailIntendantNational);
                $mailerService->sendMessage($mailAdmin);
            }
            if (($emailIntendantGeneral != $emailComptableNational) && ($emailIntendantGeneral != $emailResponsableNationalDons) && ($emailIntendantGeneral != $emailIntendantNational) && ($emailIntendantGeneral != $emailResponsableInternationalDons)){
                $mailAdmin->setTo($emailIntendantGeneral);
                $mailerService->sendMessage($mailAdmin);                
            }

            
        }
        
        
   
        
   }
   
   
    protected function addLine($titre, $reponse, $reponse2){
        if($reponse2) return "<tr><td bgcolor='#8CACBB' width=33%><i>" .$titre . "</i></td><td width=33%>" . $reponse . "</td><td width=33%>".$reponse2 ."</td></tr>";
        else return "<tr><td bgcolor='#8CACBB' width=33%><i>" .$titre . "</i></td><td width=67% colspan=2>" . $reponse . "</td></tr>";
    }
    
    protected function formatTelephone($number){
        $toReplace = array(" ", "/", "+");
        $telephoneFormat = str_replace($toReplace,"",$number); //supprimer espace, + et /
        //336xxxxxxxx
        if(strlen($telephoneFormat) == 11) {
            $telephoneFormat = "+".substr($telephoneFormat, 0,2)."/".substr($telephoneFormat, 2,1)." ".substr($telephoneFormat, 3,2)." ".substr($telephoneFormat, 5,2)." ".substr($telephoneFormat, 7,2)." ".substr($telephoneFormat, 9,2);
        }
        //00336xxxxxxxx
        else if(strlen($telephoneFormat) == 13 && substr($telephoneFormat, 0,2) == "00") {
            $telephoneFormat = "+".substr($telephoneFormat, 2,2)."/".substr($telephoneFormat, 4,1)." ".substr($telephoneFormat, 5,2)." ".substr($telephoneFormat, 7,2)." ".substr($telephoneFormat, 9,2)." ".substr($telephoneFormat, 11,2);
        }
        else if(strlen($telephoneFormat) == 10 && substr($telephoneFormat, 0,1) == "0") {
            $telephoneFormat = "+33/".substr($telephoneFormat, 1,1)." ".substr($telephoneFormat, 2,2)." ".substr($telephoneFormat, 4,2)." ".substr($telephoneFormat, 6,2)." ".substr($telephoneFormat, 8,2);
        }
        return $telephoneFormat;
    }
    
    protected function getPays(){
        switch($_SERVER['HTTP_HOST']) {
            case "chemin-neuf.fr" : 
                return "FR"; break;
        }
     }
     protected function getConfigPays(){
        switch($_SERVER['HTTP_HOST']) {
            case "chemin-neuf.fr" : 
                return "dons_fr"; break;
        }
     }
    private function translate($string,$toReplaceArray,$toReplaceWithArray)
    {
	return str_replace($toReplaceArray,$toReplaceWithArray,$string);
    
    }    
    public function getContentIdByName($name){
        $this->_dataService = Manager::getService('MongoDataAccess');
        $this->_dataService->init("Contents");
        $content = $this->_dataService->findByName($name);
        if (empty($content)) {
            throw new APIEntityException('Content not found', 404);
        }
        return $content['id'];
    }      
       
/**
     * Define the resource
     */
    protected function define()
    {
        $this
            ->definition
            ->setName('Dons')
            ->setDescription('Service de traitement des dons')
            ->editVerb('get', function (VerbDefinitionEntity &$definition) {
                $this->defineGet($definition);
            })
            ->editVerb('post', function (VerbDefinitionEntity &$definition) {
                $this->definePost($definition);
            });
    }       
       
   /**
     * Define get action
     *
     * @param VerbDefinitionEntity $definition
     */
    protected function definePost(VerbDefinitionEntity &$definition)
    {
        $definition
            ->setDescription('Inscrire le don en base de données')
            ->addInputFilter(
                    (new FilterDefinitionEntity())
                        ->setDescription('Don')
                        ->setKey('don')                            
            )
            ->addInputFilter(
                (new FilterDefinitionEntity())
                    ->setDescription('Configuration de paiement')
                    ->setKey('account')                            
            )
             ->addOutputFilter(
                (new FilterDefinitionEntity())
                    ->setDescription('Instructions')
                    ->setKey('instructions')
            );
    }
       
    /**
     * Define post
     *
     * @param VerbDefinitionEntity $verbDef
     */
    protected function defineGet(VerbDefinitionEntity &$verbDef)
    {
        $verbDef
            ->setDescription('Retour IPN de Paybox')
            ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setDescription('referencePaybox')
                            ->setKey('referencePaybox')
                            ->setFilter('string')
                            ->setRequired()
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setDescription('montant')
                            ->setKey('montant')
                            ->setFilter('string')
                            ->setRequired()
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setDescription('commande')
                            ->setKey('commande')
                            ->setFilter('string')
                            ->setRequired()
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setDescription('Autorisation')
                            ->setKey('autorisation')
                            ->setFilter('string')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setDescription('Pays')
                            ->setKey('pays')
                            ->setFilter('string')
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setDescription('erreur')
                            ->setKey('erreur')
                            ->setFilter('string')
                            ->setRequired()
                    )
                    ->addInputFilter(
                        (new FilterDefinitionEntity())
                            ->setDescription('Signature')
                            ->setKey('signature')
                            ->setFilter('string')
                            ->setRequired()
                    )
                    ->addOutputFilter(
                        (new FilterDefinitionEntity())
                            ->setDescription('message general')
                            ->setKey('message')
                    )
                    ->addOutputFilter(
                        (new FilterDefinitionEntity())
                            ->setDescription("message d'erreur de l'envoi de mail")
                            ->setKey('errors')
                    );
    }

        
}     
