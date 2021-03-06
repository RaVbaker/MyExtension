angular.module("rubedoBlocks").lazy.controller("ContentListController",['$scope','$compile','RubedoContentsService','RubedoSearchService',"$route","RubedoContentTypesService","RubedoPagesService","$location",'$filter',
                                                                        function($scope,$compile,RubedoContentsService,RubedoSearchService,$route,RubedoContentTypesService,RubedoPagesService,$location,$filter){
    var me = this;
    me.contentList=[];
    var config=$scope.blockConfig;
    var blockPagingIdentifier=$scope.block.bType+$scope.block.id.substring(21)+"Page";
    var pageId=$scope.rubedo.current.page.id;
    var siteId=$scope.rubedo.current.site.id;
    var alreadyPersist = false;
    me.contentHeight = config.summaryHeight?config.summaryHeight:80;
    me.start = config.resultsSkip?config.resultsSkip:0;
    me.limit = config.pageSize?config.pageSize:12;
    me.ismagic = config.magicQuery ? config.magicQuery : false;
    var urlCurrentPage=$location.search()[blockPagingIdentifier];
    me.lang = $route.current.params.lang;
    if (urlCurrentPage){
        me.start=(urlCurrentPage-1)*me.limit;
    }
    var options = {
        start: me.start,
        limit: me.limit,
        ismagic: me.ismagic,
        'fields[]' : ["text","summary","image","video"]
    };
    if(config.singlePage){
        options.detailPageId = config.singlePage;
    }
    if(config.enableFOContrib&&$scope.rubedo.current.user){
        //options.foContributeMode = true; ENABLE to filter contents by user
        me.isFOContributeMode=true;
        if (config.editorPageId){
            RubedoPagesService.getPageById(config.editorPageId).then(function(response){
                if (response.data.success){
                    me.editorPageUrl=response.data.url;
                }
            });
        }
    }
    me.titleOnly = config.showOnlyTitle;
    me.columns = config.columns && !config.infiniteScroll ? 'col-md-'+(12/config.columns):'col-md-12';
    me.showPaginator = config.showPager && !config.infiniteScroll;
    me.changePageAction = function(){
        options.start = me.start;
        $location.search(blockPagingIdentifier,(me.start/me.limit)+1);
        me.getContents(config.query, pageId, siteId, options);
    };
    $scope.$watch('rubedo.fieldEditMode', function(newValue) {
        alreadyPersist = false;
        me.showPaginator = newValue ? false : config.showPager && !config.infiniteScroll;
        if (newValue&&me.queryType&&me.queryType=="manual"&&!me.creatableContentTypes){
            RubedoContentTypesService.getContentTypes().then(
                function(response){
                    if (response.data.success){
                        me.creatableContentTypes=response.data.contentTypes;
                        if (response.data.contentTypes.length>0){
                            me.selectedManualType=response.data.contentTypes[0].id;
                        }

                    }
                }
            );
        }
    });
    if (config.infiniteScroll){
        me.limit = options['limit'];
        me.blockStyle = {
            height: (me.limit * me.contentHeight - me.contentHeight)+'px',
            'overflow-y': 'scroll'
        };
        me.timeThreshold = config['timeThreshold'] ? config['timeThreshold']:200;
        me.scrollThreshold = config['scrollThreshold'] ? config['scrollThreshold']:300;
    } else {
        me.blockStyle = {
            'overflow-y': 'visible'
        };
    }
    
    
    /**ALBUMS LISTS*/
    //if content type is album
    me.gallery={};

    me.getMedia = function(options){
        RubedoSearchService.getMediaById(options).then(function(response){
            if(response.data.success){
                me.gallery.images = $filter('orderBy')(response.data.results.data, 'title') ;
                me.gallery.count = response.data.count;
                me.gallery.nbPages = Math.ceil(me.gallery.count/me.gallery.limit);
            }
        });
    };
    
    me.getGallery = function(query){
        var options2 = {
             siteId: $scope.rubedo.current.site.id,
             pageId: $scope.rubedo.current.page.id,
             start:0,
             limit:200,
             query:query+"*"
         };         
        me.getMedia(options2);
    }
    me.changeGallery = function(content){
        me.getGallery(content.fields.titrePhoto);
        me.gallery.title = content.fields.text;
        me.gallery.date = content.fields.date;
        me.gallery.location = content.fields.position.address;
   }
    /*pour albums photos*/
    me.gallery.start = 0;
    me.gallery.limit = config.pageSize?config.pageSize:9;
    me.gallery.currentIndex = 0;
    me.gallery.actualPage = 1;
    me.gallery.nbImages = angular.copy(me.gallery.limit);
    me.changePage = function(side){
        if(side == 'left' && (me.gallery.currentIndex>0) ){
            if (me.gallery.currentIndex == me.gallery.start && me.gallery.start>0) {
                me.gallery.start-=me.gallery.limit;
                if (me.gallery.currentIndex+me.gallery.nbImages == me.gallery.count) {
                    me.gallery.nbImages = me.gallery.limit;
                }
            }
            me.gallery.currentIndex--;
    
        } else if(side == 'right' && (me.gallery.currentIndex < me.gallery.count-1) ) {
            if (me.gallery.currentIndex == (me.gallery.start+ me.gallery.nbImages-1) ) {
                me.gallery.start+=me.gallery.nbImages;
                if (me.gallery.start + me.gallery.nbImages >= me.gallery.count-1) {
                    me.gallery.nbImages = me.gallery.count-me.gallery.start;
                }
            }
            me.gallery.currentIndex++;
        }

        
    };
    me.nextImg = function(){
        if (me.gallery.currentIndex<me.gallery.count) {
            me.gallery.currentIndex++;
        }
        else me.gallery.currentIndex=0;
    }
    me.prevImg = function(){
        if (me.gallery.currentIndex>0) {
            me.gallery.currentIndex--;
        }
        else me.gallery.currentIndex = me.gallery.count-1;
    }
    
     /*GET CONTENTS*/
        
    me.getContents = function (queryId, pageId, siteId, options, add){
        RubedoContentsService.getContents(queryId,pageId,siteId, options).then(function(response){
            if (response.data.success){
                me.count = response.data.count;
                me.queryType=response.data.queryType;
                

                me.usedContentTypes=response.data.usedContentTypes;
                var columnContentList = [];
                if (add){
                    angular.forEach(response.data.contents,function(newContent){
                        columnContentList.push(newContent);
                    });
                    me.contentList.push(columnContentList);
                    $scope.clearORPlaceholderHeight();
                } else {
                    me.contentList=[];
                    angular.forEach(response.data.contents,function(newContent, key){
                        columnContentList.push(newContent);
                        if(config.columns && (key+1) % (Math.ceil(response.data.contents.length/config.columns)) == 0){
                            me.contentList.push(columnContentList);
                            columnContentList = [];
                        }
                    });
                    if (columnContentList.length > 0){
                        me.contentList.push(columnContentList);
                    }
                    $scope.clearORPlaceholderHeight();
                }
                
                if (me.usedContentTypes[0]=="552bda1945205e53368a64ea") {
                    me.firstAlbumTitle=response.data.contents[0].fields.titrePhoto;
                    me.changeGallery(response.data.contents[0]);
                }
                
                
                
                
            }
        });
    };
    
    
    /*PERSONS LIST*/
   me.persons = 0;
    me.nbPersons = 16;
    me.nbPersonsDisplayed = 16;
    me.pageNb = 1;
    me.nextPersons = function(){
        if (me.persons + me.nbPersonsDisplayed < me.count) {
            me.persons += me.nbPersonsDisplayed;
            me.pageNb++;
        }
        if (me.persons + me.nbPersonsDisplayed > me.count-1) {
            me.nbPersonsDisplayed = me.count-me.persons;
        }
    };
    me.prevPersons = function(){
        if (me.persons >= me.nbPersonsDisplayed) {
            me.persons -= me.nbPersons;
            me.pageNb--;
        }
        if (me.nbPersonsDisplayed !=me.nbPersons) {
            me.nbPersonsDisplayed =me.nbPersons;
        }
    }
    
    
    
    
    me.canAddToList=function(){
        return ($scope.rubedo.fieldEditMode&&me.queryType&&(me.queryType=="simple"||me.queryType=="manual"));
    };
    me.launchContribute=function(){
        if ($scope.rubedo.fieldEditMode){
            if (me.queryType=="simple"){
                me.displayEditorModal(me.usedContentTypes[0]);
            } else if (me.queryType=="manual"&&me.selectedManualType){
                me.displayEditorModal(me.selectedManualType);
            }

        }
    };
    
    
    
    
    
    
    
    
    
    me.displayEditorModal=function(typeId){
        var modalUrl = "/backoffice/content-contributor?typeId=" + typeId + "&queryId=" + config.query + "&current-page=" + $scope.rubedo.current.page.id + "&current-workspace=" + "global" +"&workingLanguage="+$route.current.params.lang;
        var availHeight=window.innerHeight*(90/100);
        var properHeight=Math.max(400,availHeight);
        var iframeHeight=properHeight-10;
        angular.element("#content-contribute-frame").empty();
        angular.element("#content-contribute-frame").html("<iframe style='width:100%;  height:"+iframeHeight+"px; border:none;' src='" + modalUrl + "'></iframe>");
        angular.element('#content-contribute-modal').appendTo('body').modal('show');
        window.confirmContentContribution=function(){
            angular.element("#content-contribute-frame").empty();
            angular.element('#content-contribute-modal').modal('hide');
            $scope.rubedo.addNotification("success","Success","Contents created.");
            me.getContents(config.query, pageId, siteId, options, false);
        };
        window.cancelContentContribution=function(){
            angular.element("#content-contribute-frame").empty();
            angular.element('#content-contribute-modal').modal('hide');
        };
    };
    $scope.loadMoreContents = function(){
        if (options['start'] + options['limit'] < me.count && !$scope.rubedo.fieldEditMode){
            options['start'] += options['limit'];
            me.getContents(config.query, pageId, siteId, options, true);
        }
    };
    $scope.persistAllChanges = function(){
        var contentsToPerist = [];
        var keysContent = [];
        if(!alreadyPersist){
            angular.forEach($scope.rubedo.registeredEditCtrls, function(contentCtrl){
                if(contentCtrl.index || contentCtrl.index === 0){
                    delete (contentCtrl.content.type);
                    contentsToPerist.push(contentCtrl.content);
                    keysContent.push({
                        index: contentCtrl.index,
                        parentIndex: contentCtrl.parentIndex
                    });
                }
            });
            RubedoContentsService.updateContents(contentsToPerist).then(
                function(response){
                    if (response.data.success){
                        var notUpdateContents = [];
                        angular.forEach(response.data.versions, function(version, key){
                            if(version){
                                me.contentList[keysContent[key]['parentIndex']][keysContent[key]['index']]['version'] = version;
                            } else {
                                notUpdateContents.push(me.contentList[keysContent[key]['parentIndex']][keysContent[key]['index']]['fields']['text']);
                            }
                        });
                        if (notUpdateContents.length === 0){
                            $scope.rubedo.addNotification("success","Success","Contents updated.");
                        } else {
                            $scope.rubedo.addNotification("warning","Warning","Some contents have not been updated",6000);
                            angular.forEach(notUpdateContents, function(notUpdate){
                                $scope.rubedo.addNotification("danger","Error","Contents update error : "+notUpdate, 6000);
                            });
                        }
                    } else {
                        $scope.rubedo.addNotification("danger","Error","Contents update error.");
                    }

                },
                function(response){
                    $scope.rubedo.addNotification("danger","Error","Contents update error.");
                }
            );
            alreadyPersist = true;
        }
    };
    if(config.query){
        me.getContents(config.query, pageId, siteId, options, false);
    }
    me.launchFOContribute=function(){
        if(me.editorPageUrl){
            $location.url(me.editorPageUrl);
        }
    }
}]);
angular.module("rubedoBlocks").lazy.controller("ContentListDetailController",['$scope','$compile','RubedoContentsService',function($scope,$compile,RubedoContentsService){
    var me = this;
    me.index = $scope.$index;
    me.parentIndex = $scope.columnIndex;
    me.content = $scope.content;
    $scope.fieldEntity=angular.copy(me.content.fields);
    $scope.fieldLanguage=me.content.locale;
    $scope.fieldInputMode=false;
    $scope.$watch('rubedo.fieldEditMode', function(newValue) {
        $scope.fieldEditMode=$scope.content.content&&me.content.readOnly ? false : newValue;

    });
    me.registerEditChanges=function(){
        $scope.rubedo.registerEditCtrl(me);
    };
    me.persistChanges = function(){
        me.content.fields = angular.copy($scope.fieldEntity);
        $scope.$parent.$parent.$parent.persistAllChanges();
    };
    me.revertChanges = function(){
      $scope.fieldEntity = angular.copy(me.content.fields);
    };
    $scope.content.type = {
        title:
        {
            cType:"textfield",
            config:{
                name:"text",
                fieldLabel:"Title",
                allowBlank:false
            }
        },
        summary:
        {
            cType:"textarea",
            config:{
                name:"summary",
                fieldLabel:"Summary",
                allowBlank:false
            }
        }
    };
    $scope.registerFieldEditChanges = me.registerEditChanges;

}]);
