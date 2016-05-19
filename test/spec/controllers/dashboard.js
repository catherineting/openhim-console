'use strict';
/* jshint expr: true */
/* global moment: false */

describe('Controller: DashboardCtrl', function () {

  // load the controller's module
  beforeEach(module('openhimConsoleApp'));

  // setup config constant to be used for API server details
  beforeEach(function(){
    module('openhimConsoleApp', function($provide){
      $provide.constant('config', { 'protocol': 'https', 'host': 'localhost', 'port': 8080, 'title': 'Title', 'footerTitle': 'FooterTitle', 'footerPoweredBy': 'FooterPoweredBy' });
    });
  });

  var scope, createController, httpBackend;
  var fourHoursAgo, threeHoursAgo, twoHoursAgo, oneHourAgo, nowHour;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $httpBackend) {

    httpBackend = $httpBackend;

    fourHoursAgo = moment().subtract(4, 'hours').startOf('hour').format();
    threeHoursAgo = moment().subtract(3, 'hours').startOf('hour').format();
    twoHoursAgo = moment().subtract(2, 'hours').startOf('hour').format();
    oneHourAgo = moment().subtract(1, 'hours').startOf('hour').format();
    nowHour = moment().startOf('hour').format();

    var statusData = [{ '_id': { 'channelID': '53884f881fdb6f2d69e29cff' }, 'failed': 10, 'successful': 58, 'processing': 0, 'completed': 20, 'completedWErrors': 2 },
                      { '_id': { 'channelID': '12344f881faa6f2d69e29cee' }, 'failed': 8, 'successful': 43, 'processing': 2, 'completed': 4, 'completedWErrors': 4 },
                      { '_id': { 'channelID': '53884f881fdb6f2d35353cdd' }, 'failed': 16, 'successful': 26, 'processing': 0, 'completed': 8, 'completedWErrors': 5 }];
    var timeLoadData = [{ 'load': 21, 'avgResp': 43269.95, 'timestamp': fourHoursAgo },
                        { 'load': 65, 'avgResp': 13367.98, 'timestamp': threeHoursAgo },
                        { 'load': 32, 'avgResp': 11249.94, 'timestamp': twoHoursAgo },
                        { 'load': 13, 'avgResp': 54668.97, 'timestamp': oneHourAgo },
                        { 'load': 56, 'avgResp': 34769.91, 'timestamp': nowHour }];

    $httpBackend.when('GET', new RegExp('.*/channels')).respond([{'_id':'5322fe9d8b6add4b2b059dd8', 'name':'Sample JsonStub Channel 1','urlPattern':'sample/api','allow':['PoC'],'routes':[{'host':'jsonstub.com','port':80,'primary':true}]}]);
    $httpBackend.when('GET', new RegExp('.*/metrics/status?.*.')).respond( statusData );
    $httpBackend.when('GET', new RegExp('.*/metrics?.*.')).respond( timeLoadData );


    createController = function() {
      scope = $rootScope.$new();
      return $controller('DashboardCtrl', { $scope: scope });
    };

  }));

  afterEach(function() {
    httpBackend.verifyNoOutstandingExpectation();
    httpBackend.verifyNoOutstandingRequest();
  });




  it('should run getLoadMetrics() and create transactionLoadData scope object', function () {
    createController();
    scope.getLoadMetrics();
    httpBackend.flush();

    scope.transactionLoadData.should.have.property('xkey', 'hour');
    scope.transactionLoadData.should.have.property('ykeys');
    scope.transactionLoadData.ykeys.length.should.equal(1);
    scope.transactionLoadData.ykeys[0].should.equal('value');
    scope.transactionLoadData.should.have.property('labels');
    scope.transactionLoadData.labels.length.should.equal(1);
    scope.transactionLoadData.labels[0].should.equal('Load');
    scope.transactionLoadData.should.have.property('postunits', ' per hour');


    // always test for current hour
    scope.transactionLoadData.data[parseInt( moment( nowHour ).format('H') )].should.have.property('value', 56);

  });


  it('should run getTimeMetrics() and create transactionResponseTimeData scope object', function () {
    createController();
    scope.getTimeMetrics();
    httpBackend.flush();

    scope.transactionResponseTimeData.should.have.property('xkey', 'hour');
    scope.transactionResponseTimeData.should.have.property('ykeys');
    scope.transactionResponseTimeData.ykeys.length.should.equal(1);
    scope.transactionResponseTimeData.ykeys[0].should.equal('value');
    scope.transactionResponseTimeData.should.have.property('labels');
    scope.transactionResponseTimeData.labels.length.should.equal(1);
    scope.transactionResponseTimeData.labels[0].should.equal('Load');
    scope.transactionResponseTimeData.should.have.property('postunits', ' ms');

    scope.transactionResponseTimeData.data[parseInt( moment( nowHour ).format('H') )].should.have.property('value', '34769.91');

  });


  it('should run getStatusMetrics() and create statusData scope object', function () {
    createController();
    scope.getStatusMetrics();
    httpBackend.flush();

    scope.statusData.should.have.property('data');
    scope.statusData.data.length.should.equal(3);
    scope.statusData.should.have.property('xkey', 'channel');
    scope.statusData.should.have.property('colors');
    scope.statusData.colors.length.should.equal(5);
    scope.statusData.should.have.property('ykeys');
    scope.statusData.ykeys.length.should.equal(5);
    scope.statusData.should.have.property('labels');
    scope.statusData.labels.length.should.equal(5);

    scope.statusData.data[0].failed.should.equal(10);
    scope.statusData.data[0].completed.should.equal(20);
    scope.statusData.data[0].completedWErrors.should.equal(2);
    scope.statusData.data[0].successful.should.equal(58);
    scope.statusData.data[0].should.not.have.property('processing');

    scope.statusData.data[1].failed.should.equal(8);
    scope.statusData.data[1].completed.should.equal(4);
    scope.statusData.data[1].completedWErrors.should.equal(4);
    scope.statusData.data[1].successful.should.equal(43);
    scope.statusData.data[1].processing.should.equal(2);

    scope.statusData.data[2].failed.should.equal(16);
    scope.statusData.data[2].completed.should.equal(8);
    scope.statusData.data[2].completedWErrors.should.equal(5);
    scope.statusData.data[2].successful.should.equal(26);
    scope.statusData.data[2].should.not.have.property('processing');
  });


});
