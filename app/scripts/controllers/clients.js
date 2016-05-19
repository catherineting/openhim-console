'use strict';

angular.module('openhimConsoleApp')
  .controller('ClientsCtrl', function ($rootScope, $scope, $modal, $interval, Api, Alerting) {


    /* -------------------------Initial load & onChanged---------------------------- */
    var querySuccess = function(clients){
      $scope.clients = clients;
      if( clients.length === 0 ){
        Alerting.AlertAddMsg('bottom', 'warning', 'There are currently no clients created');
      }
    };

    var queryError = function(err){
      // on error - add server error alert
      Alerting.AlertAddServerMsg(err.status);
    };

    // do the initial request
    Api.Clients.query(querySuccess, queryError);

    $scope.$on('clientsChanged', function () {
      Api.Clients.query(querySuccess, queryError);
    });
    /* -------------------------Initial load & onChanged---------------------------- */



    /* -------------------------Add/edit client popup modal---------------------------- */
    $scope.addClient = function() {
      Alerting.AlertReset();
      $scope.serverRestarting = false;

      $modal.open({
        templateUrl: 'views/clientsmodal.html',
        controller: 'ClientsModalCtrl',
        resolve: {
          client: function () {}
        }
      });
    };

    $scope.editClient = function(client) {
      Alerting.AlertReset();
      $scope.serverRestarting = false;

      $modal.open({
        templateUrl: 'views/clientsmodal.html',
        controller: 'ClientsModalCtrl',
        resolve: {
          client: function () {
            return client;
          }
        }
      });
    };
    /* -------------------------Add/edit client popup modal---------------------------- */



    /*------------------------Delete Confirm----------------------------*/
    $scope.confirmDelete = function(client){
      Alerting.AlertReset();
      $scope.serverRestarting = false;

      var deleteObject = {
        title: 'Delete Client',
        button: 'Delete',
        message: 'Are you sure you wish to delete the client "' + client.name + '"?'
      };

      var modalInstance = $modal.open({
        templateUrl: 'views/confirmModal.html',
        controller: 'ConfirmModalCtrl',
        resolve: {
          confirmObject: function () {
            return deleteObject;
          }
        }
      });

      modalInstance.result.then(function () {
        // Delete confirmed - delete the user
        client.$remove(deleteSuccess, deleteError);
      }, function () {
        // delete cancelled - do nothing
      });

    };

    var deleteSuccess = function () {
      // On success
      $scope.clients = Api.Clients.query();
      Alerting.AlertAddMsg('top', 'success', 'The client has been deleted successfully');
    };

    var deleteError = function (err) {
      // add the error message
      Alerting.AlertAddMsg('top', 'danger', 'An error has occurred while deleting the client: #' + err.status + ' - ' + err.data);
    };
    /*------------------------Delete Confirm----------------------------*/

  });
