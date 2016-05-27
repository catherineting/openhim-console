'use strict';

angular.module('openhimConsoleApp')
  .controller('CertificatesCtrl', function ($upload, $scope, $interval, $modal, Api, Alerting) {


    /***************************************************/
    /**         Initial page load functions           **/
    /***************************************************/

    // set variables for server restart
    $scope.serverRestarting = false;
    $scope.restartTimeout = 0;
    $scope.serverRestartRequired = false;
    $scope.serverRestartError = false;
    $scope.showImportResults = false;
    $scope.certValidity = {};

    // function to reset certs
    $scope.resetCertificates = function(){

      // get server certificate data
      Api.Keystore.get({ type: 'cert' }, function(result){
        $scope.currentServerCert = result;
      }, function(err){
        Alerting.AlertAddServerMsg(err.status);
      });

      // get trusted certificates array
      $scope.trustedCertificates = Api.Keystore.query({ type: 'ca' });
      Api.Keystore.query({ type: 'ca' }, function(result){
        $scope.trustedCertificates = result;
      }, function(err){
        Alerting.AlertAddServerMsg(err.status);
      });

      // get current certificate validity
      Api.Keystore.get({ type: 'validity' }, function(result){
        $scope.certValidity = result;
      }, function(){
        $scope.certValidity.valid = false;
      });

    };

    // set inital certs
    $scope.resetCertificates();

    /***************************************************/
    /**         Initial page load functions           **/
    /***************************************************/






    /****************************************/
    /**         Import Functions           **/
    /****************************************/

    // import failed function
    $scope.uploadFail = function(err, location, fileName){
      if ( location === 'trustedCerts' ){
        $scope.failedImports.push({ filename: fileName, error: err.data, status: err.status });
      }else{
        Alerting.AlertAddMsg(location, 'danger', 'Upload error occured: [ File: '+fileName+' ] #' + err.status + ' - ' + err.data);
      }

      $scope.importFail++;
    };

    // import success function
    $scope.uploadSuccess = function(location, fileName){
      Alerting.AlertAddMsg(location, 'success', 'Newly Uploaded File: '+fileName);
      $scope.importSuccess++;
      $scope.serverRestartRequired = true;
      $scope.resetCertificates();
      $scope.goToTop();
    };

    $scope.createCertificateSuccess = function () {

      $scope.importSuccess++;
      $scope.serverRestartRequired = true;
      $scope.resetCertificates();
      $scope.goToTop();
    };

    $scope.$on('certificatesChanged', function () {
      $scope.createCertificateSuccess();
    });

    // execute the certificate upload
    $scope.uploadCertificate = function(data, totalFiles, fileName){

      Alerting.AlertReset();

      $scope.importFail = 0;
      $scope.importSuccess = 0;
      $scope.failedImports = [];
      $scope.importProgressStatus = 0;
      $scope.importProgressType = '';

      var doneItems = 0;
      $scope.certificateObject = new Api.Keystore();

      switch ( $scope.uploadType ){
        case 'serverCert':
          $scope.certificateObject.cert = data;
          $scope.certificateObject.$save({ type: 'cert' }, function(){
            $scope.uploadSuccess('serverCert', fileName);
          }, function(err){
            $scope.uploadFail(err, 'serverCert', fileName);
          });
          break;
        case 'serverKey':
          $scope.certificateObject.key = data;
          $scope.certificateObject.$save({ type: 'key' }, function(){
            $scope.uploadSuccess('serverKey', fileName);
          }, function(err){
            $scope.uploadFail(err, 'serverKey', fileName);
          });
          break;
        case 'trustedCerts':
          $scope.certificateObject.cert = data;
          $scope.certificateObject.$save({ type: 'ca', property: 'cert' }, function(){
            $scope.uploadSuccess('trustedCerts', fileName);
          }, function(err){
            $scope.uploadFail(err, 'trustedCerts', fileName);
          });
          break;
      }

      doneItems++;
      $scope.importProgressStatus = Math.floor( doneItems / totalFiles );

      // update progress bar too 100%
      if( doneItems === totalFiles ){
        $scope.importProgressStatus = 100;
        $scope.importProgressType = 'success';
      }

    };

    /* ----- Watcher to look for dropped files ----- */

    // watch if serverCert have been dropped
    $scope.$watch('serverCert', function () {
      $scope.upload($scope.serverCert);
      $scope.uploadType = 'serverCert';
    });

    // watch if serverKey have been dropped
    $scope.$watch('serverKey', function () {
      $scope.upload($scope.serverKey);
      $scope.uploadType = 'serverKey';
    });

    // watch if trustedCerts have been dropped
    $scope.$watch('trustedCerts', function () {
      $scope.upload($scope.trustedCerts);
      $scope.uploadType = 'trustedCerts';
    });

    /* ----- Watcher to look for dropped files ----- */




    // function to upload the file
    $scope.upload = function (files) {
      if (files && files.length) {
        $scope.serverRestartError = false;

        var fileWrappedImportread = function( file ){
          return function(event) {
            var data = event.target.result;
            // read the import script data and process
            $scope.uploadCertificate(data, files.length, file.name);
          };
        };

        $scope.showImportResults = false;

        // foreach uploaded file
        for (var i = 0; i < files.length; i++) {
          var file = files[i];

          var reader = new FileReader();
          // onload function used by the reader
          reader.onload = fileWrappedImportread( file );

          if ( $scope.uploadType === 'trustedCerts' ){
            $scope.showImportResults = true;
          }

          // when the file is read it triggers the onload event function above.
          reader.readAsText(file);
        }
      }
    };

    $scope.addPassphrase = function () {
      Alerting.AlertReset();
      $scope.certificateObject = new Api.Keystore();
      $scope.certificateObject.passphrase = $scope.serverPassphrase;
      $scope.certificateObject.$save({ type: 'passphrase' }, function(){
        $scope.passphraseSuccess('serverKey', '');
      }, function(err){
        $scope.passphraseFail(err, 'serverKey', '');
      });
    };

    $scope.passphraseSuccess = function(location){
      Api.Keystore.get({ type: 'validity' }, function(result){
        $scope.certValidity = result;
        $scope.passPhraseValid = true;
        Alerting.AlertAddMsg(location, 'success', 'Passphrase matches supplied key');
        $scope.importSuccess++;
        $scope.serverRestartRequired = true;
        $scope.resetCertificates();
        $scope.goToTop();
      }, function(){
        $scope.passphraseFail(location);
      });
      $scope.serverPassphrase = null;
    };

    $scope.passphraseFail = function(location){
      Alerting.AlertAddMsg(location, 'danger', 'The passphrase does not match the key');
      $scope.passPhraseValid = false;
      $scope.serverRestartRequired = true;
      $scope.resetCertificates();
    };


    /****************************************/
    /**         Import Functions           **/
    /****************************************/







    /****************************************/
    /**         Delete Functions           **/
    /****************************************/

    $scope.confirmDelete = function(cert){
      Alerting.AlertReset();

      var deleteObject = {
        title: 'Delete Trusted Certificate',
        button: 'Delete',
        message: 'Are you sure you wish to delete the Trusted Certificate "' + cert.commonName + '"?'
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
        var certToDelete = new Api.Keystore();
        certToDelete.$remove({ type: 'ca', property: cert._id }, deleteSuccess, deleteError);
      }, function () {
        // delete cancelled - do nothing
      });

    };

    var deleteSuccess = function () {
      // On success
      $scope.resetCertificates();
      $scope.serverRestartRequired = true;
      $scope.goToTop();
      Alerting.AlertAddMsg('trustedCertDelete', 'success', 'The Trusted Certificate has been deleted successfully');
    };

    var deleteError = function (err) {
      // add the error message
      Alerting.AlertAddMsg('trustedCertDelete', 'danger', 'An error has occurred while deleting the trusted certificate: #' + err.status + ' - ' + err.data);
    };

    /****************************************/
    /**         Delete Functions           **/
    /****************************************/




    /************************************************/
    /**         Restart Server Functions           **/
    /************************************************/

    // server restart later function
    $scope.restartServerLater = function(){
      $scope.serverRestartRequired = false;
    };

    // server restart confirm function
    $scope.restartServer = function(){

      var restartServer = new Api.Restart();
      restartServer.$save({}, function(){
        // restart request sent successfully

        // update restart variables
        $scope.serverRestarting = true;
        $scope.serverRestartRequired = false;

        // set estimate time for server restart - 10 seconds
        $scope.restartTimeout = 10;
        var restartInterval = $interval(function() {
          // decrement the timer
          $scope.restartTimeout--;

          // if timer is finshed - cancel interval - update display variable
          if ($scope.restartTimeout === 0){
            $scope.serverRestarting = false;
            $scope.resetCertificates();
            $interval.cancel(restartInterval);
          }
        }, 1000);
      }, function(){
        $scope.serverRestartRequired = false;
        $scope.serverRestartError = true;
      });

    };

    /************************************************/
    /**         Restart Server Functions           **/
    /************************************************/


    $scope.addCert = function(certType) {
      Alerting.AlertReset();
      $scope.serverRestarting = false;

      $modal.open({
        templateUrl: 'views/certificateModal.html',
        controller: 'CertificatesModalCtrl',
        resolve: {
          cert: function () {},
          certType: function () {
            return certType;
          }
        }
      });
    };


    // MyEdit May 21
        //***
        // Initial load
        //***
    var querySuccess = function(revokedCerts){
      $scope.revokedCerts = revokedCerts;
      if( revokedCerts.length === 0 ){
        Alerting.AlertAddMsg('bottom', 'warning', 'There are currently no entries in the revocation list.');
      }
    };

    var queryError = function(err){
      // on error - add server error alert
      Alerting.AlertAddServerMsg(err.status);
    };

    // do the initial request
    Api.RevokedCerts.query(querySuccess, queryError);

    $scope.$on('revokedCertChanged', function () {
      Api.RevokedCerts.query(querySuccess, queryError);
    });

    //MyEdit ************* May 19 2016 **************

    // Add function
    $scope.addRevokedCert = function() {
      Alerting.AlertReset();
      $scope.serverRestarting = false;

      $modal.open({
        templateUrl: 'views/revokedCertificateModal.html',
        controller: 'RevokedCertificatesModalCtrl',

      });
    };

    // Delete Function

      

    //*************************//

  });
