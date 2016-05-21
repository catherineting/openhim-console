'use strict';
angular.module('openhimConsoleApp')
  .controller('RevokedCertificatesModalCtrl', function ($rootScope, $scope, $modalInstance, $timeout, Api, Notify, Alerting) {

    var success = function (data) {

      Alerting.AlertAddMsg('top', 'success', 'The certificate has been created, download the key and cert below.');
      var keyLink = makeTextFile(data.key);
      $scope.downloadKeyLink = angular.copy(keyLink);
      if (keyLink){
        var certLink = makeTextFile(data.certificate);
        if (certLink){
          $scope.downloadCertLink = certLink;
        }
      }

      notifyUser();
    };


    var error = function (err) {
      // add the success message
      Alerting.AlertAddMsg('top', 'danger', 'An error has occurred while creating the certificate: #' + err.status + ' - ' + err.data);
      notifyUser();
    };

    var notifyUser = function(){
      // reset backing object and refresh certificate list
      Notify.notify('revokedCertChanged');

    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };


    $scope.validateFormCertificates = function () {
      // reset hasErrors alert object
      Alerting.AlertReset('hasErrors');

      // clear timeout if it has been set
      $timeout.cancel( $scope.clearValidation );

      $scope.ngError = {};
      $scope.ngError.hasErrors = false;

      // fingerprint validation
      if( !$scope.item.fingerprint){
        $scope.ngError.days = true;
        $scope.ngError.hasErrors = true;
      }
      // issuer validation
      if( !$scope.item.issuerDN){
        $scope.ngError.issuerDN = true;
        $scope.ngError.hasErrors = true;
      }

      // serial validation
      if (!$scope.item.serial) {
        $scope.ngError.serial = true;
        $scope.ngError.hasErrors = true;
      
      }
      //$scope.cert.country = angular.uppercase($scope.cert.country);
    };

    var NewBlob = function(data, datatype){
      var out;
      try {
        out = new Blob([data], {type: datatype});
      }
      catch (e) {

        var BlobBuilder = function(){
          window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
        };

        if (e.name === 'TypeError' && window.BlobBuilder) {
          var bb = new BlobBuilder();
          bb.append(data);
          out = bb.getBlob(datatype);
        }
        else if (e.name === 'InvalidStateError') {
          // InvalidStateError (tested on FF13 WinXP)
          out = new Blob([data], {type: datatype});
        }
        else {
          out = { error: 'Browser not supported for Blob creation' };
          // We're screwed, blob constructor unsupported entirely
        }
      }
      return out;
    };

    var textFile = null;

    var makeTextFile = function (text) {
      var data = new NewBlob(text, 'application/text');
      // if blob error exist
      if ( data.error ){
        return;
      }else{
        if (textFile !== null) {
          window.URL.revokeObjectURL(textFile);
        }
        return window.URL.createObjectURL(data);
      }
    };

    $scope.submitRevokedFormCertificate = function () {
      $scope.validateFormCertificates();
      // save the client object if no errors are present
      if ( $scope.ngError.hasErrors === false ){
        $scope.save($scope.item);
      }
    };

    $scope.item = new Api.RevokedCerts();
    //$scope.cert.type = certType;



    $scope.save = function (item) {
      saveRevokedCert(item);
    };

    var saveRevokedCert = function (item) {
      // set backup client object to check if cert has changed
      //$scope.keyName = cert.commonName + '.key.pem';
      //$scope.certName = cert.commonName + '.cert.crt';
      //$scope.certBackup = angular.copy(cert);
      if ($scope.update) {
        item.$update(success, error);
      } else {
        item.$save({}, success, error);
      }
    };



    // fetch the keystore for cert dropdown
    Api.Keystore.query({ type: 'ca' }, function (certs) {
      $scope.certs = certs;
    });
    


  });
