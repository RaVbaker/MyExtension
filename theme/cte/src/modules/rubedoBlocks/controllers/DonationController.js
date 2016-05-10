angular.module("rubedoBlocks").lazy.controller("DonationController",['$scope','RubedoUserTypesService','RubedoUsersService','RubedoAuthService','RubedoPaymentMeansService','RubedoContentsService','DonationService','$filter',
                                                                     function($scope,RubedoUserTypesService,RubedoUsersService,RubedoAuthService,RubedoPaymentMeansService,RubedoContentsService,DonationService,$filter) {
    var me = this;
    var themePath='/theme/'+window.rubedoConfig.siteTheme;
    //templates
    me.donationTemplate = themePath+'/templates/blocks/donation.html';
    me.currentStage=1;
    me.userType="56e6edeac445eccc038b5b8e"; // type d'utilisateurs = donateurs
    me.civilite = {
        monsieur : $scope.rubedo.translate("Block.Inscription.Civilite.Monsieur","Monsieur"),
        madame : $scope.rubedo.translate("Block.Inscription.Civilite.Madame","Madame"),
        monsieur_ou_madame : $scope.rubedo.translate("Block.Inscription.Civilite.MonsieurOuMadame","Monsieur ou Madame"),
        mademoiselle : $scope.rubedo.translate("Block.Inscription.Civilite.Mademoiselle","Mademoiselle"),
        pere:  $scope.rubedo.translate("Block.Inscription.Civilite.Pere","Père"),
        soeur: $scope.rubedo.translate("Block.Inscription.Civilite.Soeur","Soeur"),
        frere: $scope.rubedo.translate("Block.Inscription.Civilite.Frere","Frère"),     
    };
    
    $scope.don= {};
    $scope.don.user={};
    // préremplir les champs si l'utilisateur est connecté
    if ($scope.rubedo.current.user) {
        $scope.don.user=angular.copy($scope.rubedo.current.user.fields);
        $scope.don.user.email = $scope.rubedo.current.user.email;
        if ($scope.rubedo.current.user.fields.birthdate) {
            $scope.don.user.birthdate=new Date($scope.rubedo.current.user.fields.birthdate * 1000).toISOString();
            $scope.don.birthdateF = $filter('date')( $scope.don.user.birthdate,'dd/MM/yyyy');
        }
        
    }    
    $scope.don.user.country = "FRANCE";
    $scope.don.projet = $scope.contentDetailCtrl.content.fields.text;
    $scope.don.projetId = $scope.contentDetailCtrl.content.id;
    me.toggleStage = function(newStage){
       angular.element("#inscriptionStage"+me.currentStage).collapse("hide");
       angular.element("#inscriptionStage"+newStage).collapse("show");
       me.currentStage = newStage;
    }


    
    RubedoPaymentMeansService.getPaymentMeansDons().then(
        function(response){
            if(response.data.success){
                me.paymentmeans = response.data.paymentMeans;
                var options = {
                    siteId: $scope.rubedo.current.site.id,
                    pageId: $scope.rubedo.current.page.id
                };
                /*get contact national défini dans la config de payement*/
                RubedoContentsService.getContentById(response.data.paymentMeans.nativePMConfig.contactDonsId, options).then(
                    function(response){
                        if(response.data.success){
                            $scope.contentDetailCtrl.contactNational=response.data.content;
                        }
                    }
                );
                me.fiscalites = {};
                me.account = {};
                me.fiscalitesCount=0;
                /*get fiscalités*/
                angular.forEach($scope.contentDetailCtrl.content.fields[me.paymentmeans.nativePMConfig.fiscalite], function(fiscalite){
                    RubedoContentsService.getContentById(fiscalite, options).then(
                        function (response) {
                            if(response.data.success){
                                me.fiscalites[response.data.content.text] = {
                                    "label" : response.data.content.text,
                                    "fields":response.data.content.fields
                                };
                                me.account = response.data.content.fields;
                                me.fiscalitesCount++;
                            }
                        }
                    );
                });
                
            }
               
        });                
    me.setCurrentStage = function(step, valide) {
        if(valide){
            /*
            if (step==3) {
                    me.stage2Error=null;
                    if (!$scope.rubedo.current.user){
                        me.createUser();
                    } else {
                        me.persistUserChanges(me.stage2Error);
                    }

            }
            else */
            
            me.toggleStage(step);
        }  
    };
    //validation du don et inscription dans la base de données
    me.submit = function(isValide){
        if (isValide) {
            $scope.don.etat ="attente_paiement_"+$scope.don.modePaiement;
            /*déterminer la config de dons choisie*/
            if (me.fiscalitesCount>0) {
                me.account = me.fiscalites[$scope.don.condition].fields;
            }
            DonationService.donate($scope.don, me.account).then(function(response){
                if (response.data.success) {

                }
            })
        }
    };
    
    me.parseUserType=function(userType){
        me.userType=userType;
        $scope.fieldIdPrefix="checkout"+"_"+me.userType.type;
        if (!$scope.rubedo.current.user){
            me.userType.fields.unshift({
                cType:"textfield",
                config:{
                    name:"confirmPassword",
                    fieldLabel:$scope.rubedo.translate("Blocks.SignUp.label.confirmPassword"),
                    allowBlank:false,
                    vtype:"password"
                }
            });
            me.userType.fields.unshift({
                cType:"textfield",
                config:{
                    name:"password",
                    fieldLabel:$scope.rubedo.translate("Blocks.SignUp.label.password"),
                    allowBlank:false,
                    vtype:"password"
                }
            });
        }
        me.userType.fields.unshift({
            cType:"textfield",
            config:{
                name:"email",
                fieldLabel:$scope.rubedo.translate("Label.Email"),
                allowBlank:false,
                vtype:"email"
            }
        });
        me.userType.fields.unshift({
            cType:"textfield",
            config:{
                name:"name",
                fieldLabel:$scope.rubedo.translate("Blocks.SignUp.label.name"),
                allowBlank:false
            }
        });
        me.inputFields=me.userType.fields;
    };
    me.initializeCheckout=function(){
        $scope.fieldIdPrefix="donation";

        $scope.fieldInputMode=true;
        if (!$scope.rubedo.current.user){
            if (me.userType){
                RubedoUserTypesService.getUserTypeById(me.userType).then(
                    function(response){
                        if (response.data.success){
                            me.parseUserType(response.data.userType);
                        }
                    }
                );
            }
        } else {
            RubedoUsersService.getUserById($scope.rubedo.current.user.id).then(
                function(response){
                    if (response.data.success){
                        me.currentUser=response.data.user;
                        var existingData=angular.copy(me.currentUser.fields);
                        $scope.don.user = angular.copy(me.currentUser.fields);
                        //me.parseUserType(me.currentUser.type);
                    }
                }
            );
        }
    };
    me.createUser=function(){
        if ($scope.don.user.confirmPassword!=$scope.don.user.password){
            me.stage2Error="Passwords do not match.";
            return;
        }
        var newUserFields=angular.copy($scope.don.user);
        delete (newUserFields.confirmPassword);
        newUserFields.login=newUserFields.email;

        RubedoUsersService.createUser(newUserFields,"56e6edeac445eccc038b5b8e").then(
            function(response){
                if (response.data.success){
                    RubedoAuthService.generateToken({login:newUserFields.login,password:newUserFields.password},me.rememberMe).then(
                        function(authResponse){
                            me.toggleStage(3);
                        }
                    );
                }
            },
            function(response){
                me.stage2Error=response.data.message;
            }
        );
    };    
    me.persistUserChanges=function(errorHolder,refreshShippers){
        var payload=angular.copy(me.currentUser);
        payload.fields=angular.copy($scope.don.user);
        delete (payload.type);
        RubedoUsersService.updateUser(payload).then(
            function(response){
                me.toggleStage(3);
            },
            function(response){
                me.errorHolder=response.data.message;
            }
        );
    };
    

        /*me.initializeCheckout();*/
        
    /*VALIDATION*/
        $scope.isTelephoneRequired = function () {
            return  !($scope.don.user.tel1 || $scope.don.user.tel2); // au moins téléphone fixe ou portable
    };
    
}]);


