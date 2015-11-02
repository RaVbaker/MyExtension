angular.module("rubedoBlocks").lazy.controller("ButtonToPageController",['$scope','RubedoPagesService',function($scope,RubedoPagesService){
    var me = this;
    var blockConfig=$scope.blockConfig;
    me.inputFields=[ ];
    $scope.fieldEntity={ };
    $scope.fieldInputMode=true;
    me.columns = blockConfig.columns ? 'col-md-'+(12/config.columns):'col-md-12';
    var fields=angular.copy($scope.fieldEntity);
    
	if (blockConfig.linkedPage&&mongoIdRegex.test(blockConfig.linkedPage)) 
		{
			RubedoPagesService.getPageById(blockConfig.linkedPage).then(function(response){
					if (response.data.success){
						me.pageLink=response.data.url;
					}
				});
		};
			
	
}]);