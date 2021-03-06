angular.module("rubedoBlocks").lazy.controller("InscriptionController",['$scope','$rootScope','RubedoContentsService','InscriptionService','PaymentService','RubedoMediaService','RubedoSearchService','$timeout','$filter',
                                                                        function($scope,$rootScope,RubedoContentsService,InscriptionService,PaymentService,RubedoMediaService,RubedoSearchService,$timeout,$filter) {
    var me = this;
    var themePath='/theme/'+window.rubedoConfig.siteTheme;
    me.form={};
    //templates
    me.infos_individuel = themePath+'/templates/blocks/formulaire/infos_individuel.html';
    me.couple = themePath+'/templates/blocks/formulaire/couple.html';
    me.questions = themePath+'/templates/blocks/formulaire/questions.html';
    me.questionDetail = themePath+'/templates/blocks/formulaire/questionDetail.html';
    me.infosFin = themePath+'/templates/blocks/formulaire/infosFin.html';
    me.enfants = themePath+'/templates/blocks/formulaire/enfants.html';
    me.paiment_complementaire= themePath+'/templates/blocks/formulaire/paiment_complementaire.html';
    me.content = angular.copy($scope.proposition);
    
    getForms = function(public) {
        switch(public) {
            case 'adolescent':
                me.general_infos = themePath+'/templates/blocks/formulaire/infos_individuel.html';
                me.additional_infos = null;
                break;
            case 'jeune-adulte':
                me.general_infos = themePath+'/templates/blocks/formulaire/infos_individuel.html';
                me.additional_infos = null;
                break;
            case 'personne-avec-enfants':
                me.general_infos = themePath+'/templates/blocks/formulaire/infos_individuel.html';
                me.additional_infos = themePath+'/templates/blocks/formulaire/enfants.html';
                break;
            case 'adulte':
                me.general_infos = themePath+'/templates/blocks/formulaire/infos_individuel.html';
                me.additional_infos = null;
                break;
            case 'couple':
                me.general_infos = themePath+'/templates/blocks/formulaire/couple.html';
                me.additional_infos = null;
                break;            
            case 'fiances':
                me.general_infos = themePath+'/templates/blocks/formulaire/couple.html';
                me.additional_infos = null;
                break;   
            case 'famille':
                me.general_infos = themePath+'/templates/blocks/formulaire/couple.html';
                me.additional_infos = themePath+'/templates/blocks/formulaire/enfants.html';
                break;
            default:me.general_infos = themePath+'/templates/blocks/formulaire/infos_individuel.html';
        }
    }
    getForms($scope.contentDetailCtrl.content.public);
    $scope.inscription={};
    $scope.inscription.optionsPayantes={};

//get proposition
    var propositionId = me.content.id;
    var propositionTitle = me.content.text;
    var propositionDate = $scope.rubedo.translate("date.from", "du")+ " " +$filter('date')(me.content.fields.dateDebut* 1000, 'fullDate');
    if (me.content.fields.heureDebut) {
        propositionDate += " "+$scope.rubedo.translate("Time.At", "à")+" " + me.content.fields.heureDebut ;
    }
    propositionDate +=  " "+$scope.rubedo.translate("date.to", "au")+" " + $filter('date')(me.content.fields.dateFin* 1000, 'fullDate');
    if (me.content.fields.heureFin) {
        propositionDate +=  " "+$scope.rubedo.translate("Time.At", "à")+" " + me.content.fields.heureFin;
    }
    

                    
    $scope.inscription.public_type=angular.copy(me.content.public);
    $scope.inscription.serviteur=angular.copy(me.content.service);
    $scope.inscription.positionName = me.content.fields.positionName;

    //surveiller si le type de formulaire est changé pour changer le template
    $scope.$watch("contentDetailCtrl.content.public", function(newValue, oldValue) {
        $scope.inscription.public_type=newValue; getForms(newValue);
    });
    $scope.$watch("contentDetailCtrl.content.service", function(newValue, oldValue) {
        $scope.inscription.serviteur=newValue;
   });


    
    $scope.inscription.personneConnue = false;
    $scope.inscription.entretien = false;
    $scope.inscription.motivation = false;
    $scope.inscription.enfants=[];
    $scope.inscription.enfant={};
    // vérifier les infos complémentaires pour le formulaire
    if ((me.content.fields.questions1) && me.content.fields.questions1.questions1 && ((me.content.fields.questions1.questions1).length>0)) {
        if(typeof me.content.fields.questions1.questions1 =='string') {
            me.form[me.content.fields.questions1.questions1] = true;
        }
        else {
            angular.forEach(me.content.fields.questions1.questions1, function(option, key){
                me.form[option] = true;
            });
        }
    }
    $scope.personneConnue = angular.copy(me.form.personneConnue);//vrai si formulaire pour personnes connues -> seulement nom, prénom et mail
    $scope.allowOneParentOnly = angular.copy(me.form.parent_seul);//vrai si formulaire pour personnes connues -> seulement nom, prénom et mail
    
    
    // questions complémentaires ?
    if ( me.form.jai_connu) {me.isComplement = true;}
    if ((me.content.fields.paimentOption)
            &&(me.content.fields.paimentOption.paimentOption) 
            && ((me.content.fields.paimentOption.paimentOption).length>0)
            && (me.content.fields.paimentOption.paimentOption[0]!=null || me.content.fields.paimentOption.paimentOption[1]!=null)) {
        me.isPaiement = true;
    }
    else if (me.content.fields.accompte>0  && me.content.fields.inscriptionState.inscriptionState!='preinscription' && me.content.fields.inscriptionState.inscriptionState!='attente') {
        me.isPaiement = true;
        me.isPaimentAccompteSeulement = true;
    }
       
                
    if (( typeof me.content.fields.paimentOption.paimentOption =='string')) {
        me.content.fields.paimentOption.paimentOption = {0 : me.content.fields.paimentOption.paimentOption};
    }          
    
    
    
    
    
    var options = {
            siteId: $scope.rubedo.current.site.id,
            pageId: $scope.rubedo.current.page.id
    };
    // ajouter enfants

    me.addChild = function(enfant){

        if (!$scope.inscription.enfants) {
            $scope.inscription.enfants=[];
        }
        $scope.inscription.enfants.push(angular.copy(enfant));
    }
    // supprimer enfant
    me.removeChild = function(index){
        $scope.inscription.enfants.splice(index, 1);
    };
    // préremplir les champs si l'utilisateur est connecté
    if ($scope.rubedo.current.user) {
        $scope.inscription=angular.copy($scope.rubedo.current.user.fields);
        $scope.inscription.email = $scope.rubedo.current.user.email;
        $scope.inscription.email_verif = $scope.rubedo.current.user.email;
        if ($scope.rubedo.current.user.fields.birthdate) {
            $scope.inscription.birthdate=new Date($scope.rubedo.current.user.fields.birthdate * 1000).toISOString();
            $scope.inscription.birthdateF = $filter('date')( $scope.inscription.birthdate,'dd/MM/yyyy');
        }
        
    }
    
    // prix pour les questions
    me.setPrice = function(questionType,title,index,question){
        if(!$scope.inscription.optionsPayantes) $scope.inscription.optionsPayantes={};
        
        if($scope.inscription[questionType][title][index]!=false) {
            if(question.prix!=null) {
                $scope.inscription.optionsPayantes[question.titre] =question.prix;
            }
            else $scope.inscription.optionsPayantes[question.titre] = 0;
        }
        else {delete($scope.inscription.optionsPayantes[question.titre]);}
       
    }

    /*get fields for inscription*/
    me.getFieldByName=function(name){
        var field=null;
        angular.forEach(me.content.type.fields,function(candidate){
            if (candidate.config.name==name){
                field=candidate;
            }
        });
        
        return field;
    };
    
    //labels des questions radio / checkbox
    me.getLabel = function(field,name) {
        var value = null;
        if (field.cType == 'combobox') {
            angular.forEach(field.store.data,function(candidate){
                if (candidate.valeur == name) {
                    value = candidate.nom;
                }
            });
        }
        else if (field.cType == 'checkboxgroup') {
            angular.forEach(field.config.items,function(candidate){
                if (candidate.inputValue == name) {
                    value = candidate.boxLabel;
                }
            });
        }
        
        return value;
    };
    // récupérer les questions complémentaires
    me.getQuestions = function() {
        me.form.questions={
            "complementaires":[],
            "transport":[],
            "logement":[]/*,
            "generale":[]*/
        };
        angular.forEach(me.content.fields.questions, function(questionId, questionOrder){
            RubedoContentsService.getContentById(questionId, options).then(function(response){
                if (response.data.success){
                    var questionReponse= response.data.content;
                    switch (questionReponse.fields.categorie.categorie) {
                        case "complementaire": me.form.questions.complementaires.push({"text":questionReponse.text, "fields":questionReponse.fields,"order":questionOrder}); me.isComplement = true; break;
                        case "transport": me.form.questions.transport.push({"text":questionReponse.text, "fields":questionReponse.fields,"order":questionOrder}); me.isTransport = true; break;
                        case "logement": me.form.questions.logement.push({"text":questionReponse.text, "fields":questionReponse.fields,"order":questionOrder});me.isLogement = true;  break;
                        //case "generale": me.form.questions.generale.push({"text":questionReponse.text, "fields":questionReponse.fields}); break;
                    };
                  

                }
            });
            
        });
    };
    /*récupérer le formulaire pour l'inscriptino*/
    if (me.content.fields.formulaire_pdf && me.content.fields.formulaire_pdf!="") {
        RubedoMediaService.getMediaById(me.content.fields.formulaire_pdf).then(
            function(response){
                if (response.data.success){
                    $scope.inscription.formulaire_pdf=response.data.media;
                }
            }
        );
    }

    // VALIDATIONS ANGULAR
    
    //telephones
    $scope.isTelephoneRequired = function () {
        if($scope.inscription.public_type == 'adolescent')
            return !($scope.inscription.tel1  || $scope.inscription.tel2Pers2); // au moins téléphone fixe / portable / parent
        else if ($scope.inscription.public_type == 'couple' || $scope.inscription.public_type=='famille') {
            return !($scope.inscription.tel2 || $scope.inscription.tel2Pers2 || $scope.inscription.tel1); // au moins portable de lui / elle / téléphone fixe
        }
        else
            return  !($scope.inscription.tel1 || $scope.inscription.tel2); // au moins téléphone fixe ou portable
    };

// s'il y a des questions complémentaires, les récupérer
    if (me.content.fields.questions && (me.content.fields.questions).length>0) {
        me.getQuestions();
    }
    
    //informations sur les moyens de payement
    me.paymentmeans = $scope.contentDetailCtrl.paymentmeans;

    
    
    
    
    me.currentStage = 1;
 // affichage des sections du formulaire
    me.toggleStage = function(newStage){
       angular.element("#inscriptionStage"+me.currentStage).collapse("hide");
       angular.element("#inscriptionStage"+newStage).collapse("show");
       me.currentStage = newStage;
    }
    
    me.setCurrentStage = function(step, valide) {
        if (!valide && step==0) {
            me.toggleStage(1);
        }
        if (valide && (me.currentStage >= step)) {
            
            if (step==0) {me.toggleStage(1);}
            else if (step==1) {
                if( $scope.inscription.email != $scope.inscription.email_verif){
                    $scope.mailError = true;me.currentStage=1;
                }
                else if ($scope.inscription.emailPers2 != $scope.inscription.emailPers2_verif) {
                    $scope.mailError2 = true;
                    $scope.mailError = false;
                    me.currentStage=1;
                }
                else if (me.isComplement) {me.toggleStage(2);$scope.mailError = false;$scope.mailError2 = false;}
                else if (me.isTransport) {me.toggleStage(3);$scope.mailError = false;$scope.mailError2 = false;}
                else if (me.isLogement) {me.toggleStage(4);$scope.mailError = false;$scope.mailError2 = false;}
                else if(me.isPaiement) {me.toggleStage(5);$scope.mailError = false;$scope.mailError2 = false;}
                else {me.toggleStage(6);$scope.mailError = false;$scope.mailError2 = false;}
            }
            else if (step==2) {
                if (me.isTransport) {me.toggleStage(3);}
                else if (me.isLogement) {me.toggleStage(4);}
                 else if(me.isPaiement) {me.toggleStage(5);}
               else {me.toggleStage(6);}
            }
            else if (step==3) {
                if (me.isLogement) {me.toggleStage(4);}
                 else if(me.isPaiement) {me.toggleStage(5);}
                else {me.toggleStage(6);}
            }
            else if(step==4) {
                if(me.isPaiement) {me.toggleStage(5);}
                else me.toggleStage(6);
            }
            else if (step==5) {
                me.toggleStage(6);
            }
        }
        if (valide && step==6) {
            // validations préliminaires
            $scope.processForm=true;
            
            $scope.inscription.proposition=  propositionId;
            $scope.inscription.propositionTitre=  propositionTitle;
            $scope.inscription.propositionDate = propositionDate;
            $scope.inscription.dateDebut = me.content.fields.dateDebut;
            $scope.inscription.propositionLieu = me.content.fields.positionName;
            $scope.inscription.propositionUrl = me.content.canonicalUrl;
            $scope.inscription.shortName = propositionTitle.replace(/[ -]/g, "_");
            $scope.inscription.accompte = me.content.fields.accompte ?me.content.fields.accompte : 0;
            $scope.inscription.contact = me.content.fields.contact;
            if (me.content.fields.mails_secretariat && me.content.fields.mails_secretariat.length>0) {
                $scope.inscription.mails_secretariat = me.content.fields.mails_secretariat;
            }
            if(me.content.fields.codeOnesime) $scope.inscription.codeOnesime = me.content.fields.codeOnesime;
            $scope.inscription.mailInscription = me.content.fields.mailInscription;
            $scope.inscription.mailInscriptionService = me.content.fields.mailInscriptionService;
            
            $scope.inscription.personneConnue = me.form.personneConnue;
            $scope.inscription.entretien = me.form.entretien;
            $scope.inscription.motivation = me.form.motivation;
            /*enfant*/
            if($scope.inscription.enfant && $scope.inscription.enfant !={} && $scope.inscription.enfant.prenom && $scope.inscription.enfant.prenom!='') {
              me.addChild($scope.inscription.enfant);
            }

            if($scope.inscription.paiement_maintenant == 'rien'){$scope.inscription.montantAPayerMaintenant=0}
            else if($scope.inscription.paiement_maintenant == 'accompte'){$scope.inscription.montantAPayerMaintenant=me.content.fields.accompte}
            else if($scope.inscription.paiement_maintenant == 'totalite'){$scope.inscription.montantAPayerMaintenant=$scope.inscription.montantTotalAPayer};
            $scope.inscription.isPayment = me.isPaiement;
            /*STATUS DE L'INSCRIPTION*/
            switch(me.content.fields.inscriptionState.inscriptionState) {
                case "attente":
                    $scope.inscription.statut = "liste_attente";
                    break;
                case 'preinscription':
                    $scope.inscription.statut = "preinscrit";
                    break;
                default:
                    if (me.isPaiement) {
                        /*pas de paiement maintenant*/
                        if ($scope.inscription.paiement_maintenant =="rien") {
                            $scope.inscription.statut = 'inscrit_sans_accompte';
                        }
                        else{
                            $scope.inscription.statut = "attente_paiement_"+$scope.inscription.modePaiement;
                        }
                        $scope.inscription.montantAPayerMaintenantAvecMonnaie = ($scope.inscription.montantAPayerMaintenant).toString() + me.paymentmeans.nativePMConfig.monnaie;
                        if($scope.inscription.montantTotalAPayer && $scope.inscription.montantTotalAPayer>0) $scope.inscription.montantTotalAPayerAvecMonnaie=($scope.inscription.montantTotalAPayer).toString() + me.paymentmeans.nativePMConfig.monnaie;
                        if($scope.inscription.accompte>0) $scope.inscription.accompteAvecMonnaie=($scope.inscription.accompte).toString() + me.paymentmeans.nativePMConfig.monnaie;
                    }
                    
            }
            InscriptionService.inscrire($scope.inscription, $scope.rubedo.current.page.workspace).then(function(response){
                $scope.message="";
                if (response.data.success) {
                    // si paiement par Paybox
                    if ($scope.inscription.modePaiement=='carte') { 
                        var payload = {
                            nom:$scope.inscription.nom,
                            prenom: $scope.inscription.surname,
                            email:$scope.inscription.email,
                            montant:$scope.inscription.montantAPayerMaintenant,
                            proposition:propositionTitle,
                            idInscription: response.data.id,
                            accountName:me.paymentmeans.paymentMeans
                        };
                        /*si ados, le mail indiqué pour le payement est celui du parent*/
                        if($scope.inscription.public_type == 'adolescent' && $scope.inscription.emailPers2 && $scope.inscription.emailPers2!=''){
                            payload.email = $scope.inscription.emailPers2;
                        }
                        if (me.content.fields.lieuCommunautaire) {
                            payload.placeID=me.content.fields.lieuCommunautaire;
                        }
                        if(window.ga) {
                            window.ga('send', 'event', 'inscription', 'payement carte', 'inscriptions', $scope.inscription.montantAPayerMaintenant);
                        }
                        payload.paymentType= 'paf';
                        payload.onlinePaymentMeans=me.paymentmeans.onlinePaymentMeans;
                        if (me.paymentmeans.onlinePaymentMeans=='dotpay') {
                            payload.infos=$scope.inscription;

                        }
                        PaymentService.payment(payload).then(function(response){
                            if (response.data.success) {
                                $scope.parametres = response.data.parametres;
                                /*délai pour laisser le formulaire se remplir*/
                                $timeout(function() {
                                    $scope.processForm=false;
                                    document.getElementById('payment').submit();
                                }, 100);
                            }
                            else {
                                $scope.processForm=false;
                                $scope.finInscription=true;  
                                $scope.inscription={};
                                $scope.message+="Il y a eu une erreur dans lors de l'enregistrement de votre paiement. Merci de réessayer ou de contacter le secrétariat.";
                            }
                            
                        });
                        
                    }
                    // pas de paiement par carte
                    else {
                        if(window.ga) {
                            window.ga('send', 'event', 'inscription', 'pas de payment', 'inscriptions', $scope.inscription.montantAPayerMaintenant);
                        }
                        $scope.processForm=false;
                        $scope.finInscription=true; 
                        $scope.inscription={};
                        $scope.message += $scope.rubedo.translate("Block.Inscription.Succes","Votre inscription a bien été prise en compte. Merci et à bientôt !");
                    }
                    
                    
                }
                else {
                    if(window.ga) {
                        window.ga('send', 'event', 'inscription', 'erreur');
                    }
                   
                    $scope.processForm=false;
                    $scope.finInscription=true; 
                    $scope.message +="Il y a eu une erreur lors de la prise en compte de votre inscription. Merci de réessayer plus tard ou de contacter le secrétariat.";
                }
            })
            
                
                
                
        }
    }
    
    //paiements complémentaires
    me.getInscription = function(email){
        var options = {
            start: 0,
            limit: 100,
            constrainToSite: false,
            //predefinedFacets: config.predefinedFacets,
            //displayedFacets: config.displayedFacets,
            orderby: 'lastUpdateTime',
            orderbyDirection:'desc',
            //query:'"'+email+'"',
            type:"561627c945205e41208b4581",
            taxonomies:{
                "proposition":[propositionId],
                "email":[email]
            },
            pageId: $scope.rubedo.current.page.id,
            siteId: $scope.rubedo.current.site.id           
        };
        RubedoSearchService.searchByQuery(options).then(function(response){
            if(response.data.success){
                me.inscriptionsCount = response.data.count;
                me.showInscriptionResult = true;
                if (response.data.count>0) {
                    RubedoContentsService.getContentById(response.data.results.data[0].id).then(
                        function(response){
                            if(response.data.success){
                                me.lastInscription = response.data.content;
                            }
                        }
                    );
                }
            }
        });
    }
    me.payementComplementaire = function(){
        $scope.processForm=true;
        var payload = {
            nom:me.lastInscription.fields.nom,
            prenom: me.lastInscription.fields.surname,
            email:$scope.inscription.email,
            montant:$scope.inscription.montantAPayerMaintenant,
            proposition:propositionTitle,
            idInscription: me.lastInscription.fields.text,
            paymentType:'paf'
        };
        if (me.content.fields.lieuCommunautaire) {
            payload.placeID=me.content.fields.lieuCommunautaire;
        }
        if(window.ga) {
            window.ga('send', 'event', 'inscription', 'payement carte', 'paiement complementaire', $scope.inscription.montantAPayerMaintenant);
        }
        PaymentService.payment(payload).then(function(response){
            if (response.data.success) {
                $scope.parametres = response.data.parametres;
                /*délai pour laisser le formulaire se remplir*/
                $timeout(function() {
                    $scope.processForm=false;
                    document.getElementById('payment').submit();
                }, 100);
            }
            else {
                $scope.processForm=false;
                $scope.finInscription=true;  
                $scope.inscription={};
                $scope.message+="Il y a eu une erreur dans lors de l'enregistrement de votre paiement. Merci de réessayer ou de contacter le secrétariat.";
            }
            
        });        
    }


    
}]);


