angular.module("rubedoBlocks").lazy.controller('ImageBatchUploadController',['$scope','RubedoMediaService','RubedoPagesService','$http','$location','Upload',function($scope,RubedoMediaService,RubedoPagesService,$http,$location,Upload){
    var me = this;
    var config = $scope.blockConfig;    
    me.files=[];
    me.progress = 0;
    me.pageUrl="";
    me.workspace="";
    if (config.linkedPage&&mongoIdRegex.test(config.linkedPage)) {
        RubedoPagesService.getPageById(config.linkedPage).then(function(response){
            if (response.data.success){
                me.pageUrl=response.data.url;
                $http.get("/api/v1/pages",{
                    params:{
                        site:$location.host(),
                        route:(me.pageUrl).substr(4)
                    }
                }).then(function(response){if(response.data.success) {me.workspace= response.data.page.workspace;$scope.clearORPlaceholderHeight(); }});
            };
        });
    };
/*
    me.submitNewFiles=function(){
        var batch = false;

        var uploadOptions={
               typeId:"545cd95245205e91168b45b1",//pour des images
               target:me.workspace
        };
        if (me.batchTitle && me.batchTitle!="") {
            batch = true;
        }
        var nbOfImages = me.files.length;
        angular.forEach(me.files, function(file, index) {
            var options = angular.copy(uploadOptions);
            if (!batch) {
                options.fields={title : file.name};
            }
            else {
                options.fields={title : me.batchTitle + '_'+index};
            }
            
            RubedoMediaService.uploadMedia(file,options).then(
               function(response){
                   if (response.data.success){
                       me.progress += 100* 1/nbOfImages;
                   } else {


                   }
               }
           );
        });


    };
    */
    
    $scope.$watch('files', function () {
        $scope.upload($scope.files);
    });
    $scope.upload = function(files) {
        var batch = false;

        var uploadOptions={
               typeId:"545cd95245205e91168b45b1",//pour des images
               target:me.workspace
        };
        if (me.batchTitle && me.batchTitle!="") {
            batch = true;
        }
        //var nbOfImages = files.length;
        if (files && files.length) {
            for (var i = 0; i < files.length; i++) {
                var imgTitle="";
                if (!batch) {
                    imgTitle=file[i].name;
                }
                else {
                    imgTitle=me.batchTitle + '_'+i;
                }
                Upload.upload({
                    url: '/api/v1/media',
                    method: 'POST',
                    params:{
                        typeId:"545cd95245205e91168b45b1",
                        target:me.workspace,
                        fields:{title:imgTitle}
                    },
                    file: files[i],
                    headers: {'Content-Type': undefined}
                });
            }
        }
        /*
        serviceInstance.uploadMedia=function(file,options){
            var fd = new FormData();
            fd.append('file', file);
            return($http.post("/api/v1/media", fd, {
                transformRequest: angular.identity,
                params:options,
                headers: {'Content-Type': undefined}
            }));
        };
         */
        
        /*
        angular.forEach(files, function(file, index) {
            var options = angular.copy(uploadOptions);
            if (!batch) {
                options.fields={title : file.name};
            }
            else {
                options.fields={title : me.batchTitle + '_'+index};
            }
            
            RubedoMediaService.uploadMedia(file,options).then(
               function(response){
                   if (response.data.success){
                       me.progress += 100* 1/nbOfImages;
                   } else {


                   }
               }
           );
        }); */       
    };

}]);
    
    
    
    
    
    
    
    
