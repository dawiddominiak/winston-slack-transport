var assert, chai, expect, fs, parsedError, path, rawError, sinon, sinonChai, slackOptions, testLevels, testTypes, winston, winstonSlack, winstonSlackClass, _;

_ = require('lodash');

fs = require('fs');

chai = require('chai');

path = require('path');

sinon = require('sinon');

sinonChai = require('sinon-chai');

assert = chai.assert;

expect = chai.expect;

chai.use(sinonChai);

winston = require('winston');

winstonSlackClass = require('../lib');

rawError = fs.readFileSync('./test/sample_error_raw.txt', 'utf8');

parsedError = fs.readFileSync('./test/sample_error_parsed.txt', 'utf8');

slackOptions = {
  webHookUrl: 'https://hooks.slack.com/services/F0U7KcIg6wtFTmUi7ZwWDG9fmchnt2u40wEgW5xai9o4',
  channel: '#samplechannel',
  username: 'ErrorBot',
  level: 'error',
  pid: process.pid,
  app: path.basename(process.argv[1], '.js')
};

winstonSlack = new winstonSlackClass(slackOptions);

testTypes = ['normal', 'errorParsing'];

testLevels = function(levels, transport, assertMsg, testType) {
  var tests;
  tests = [];
  Object.keys(levels).forEach(function(level, index) {
    return tests.push({
      name: "" + assertMsg + " with the '" + level + "' level",
      fn: function(done) {
        var logOptions, sendOptions;
        if (testType == null) {
          testType = 'normal';
        }
        logOptions = {};
        logOptions.level = level;
        logOptions.msg = 'test message';
        logOptions.meta = {};
        if (testType === 'errorParsing') {
          logOptions.meta = {
            errorStack: rawError
          };
        }
        sendOptions = {};
        sendOptions.channel = slackOptions.channel;
        sendOptions.username = slackOptions.username;
        sendOptions.text = "*" + logOptions.msg + "*";
        if (testType === 'errorParsing') {
          sendOptions.text = "*" + logOptions.msg + "*\n" + parsedError;
        }
        return transport.log(logOptions.level, logOptions.msg, logOptions.meta, function(err) {
          var sendLastCall;
          expect(transport.log).to.have.been.calledWith(logOptions.level, logOptions.msg, logOptions.meta);
          if (testType === 'normal') {
            expect(transport.log.callCount).to.equal(index + 1);
            expect(transport.slack.send.callCount).to.equal(index + 1);
          }
          sendLastCall = transport.slack.send.lastCall;
          expect(sendLastCall.args[0].channel).to.equal(sendOptions.channel);
          expect(sendLastCall.args[0].username).to.equal(sendOptions.username);
          expect(sendLastCall.args[0].text).to.equal(sendOptions.text);
          sendLastCall.args[0].attachments[0].fields.forEach(function(field) {
            if (field != null) {
              return expect(field).to.contain.keys(['title', 'value']);
            }
          });
          return done();
        });
      }
    });
  });
  return tests;
};


/* */

describe('winston-slack-transport tests', function() {
  before(function() {
    sinon.spy(winstonSlack.slack, 'send');
    return sinon.spy(winstonSlack, 'log');
  });
  describe('levels tests', function() {
    var arrErrorParsingLevels, arrTestLevels, test, _i, _j, _len, _len1, _results;
    before(function() {
      return sinon.stub(winstonSlack.slack, 'request', function(data, done) {
        return done();
      });
    });
    after(function() {
      return winstonSlack.slack.request.restore();
    });
    arrTestLevels = testLevels(winston.config.npm.levels, winstonSlack, 'Should respond and pass variables');
    for (_i = 0, _len = arrTestLevels.length; _i < _len; _i++) {
      test = arrTestLevels[_i];
      it(test.name, test.fn);
    }
    arrErrorParsingLevels = testLevels(winston.config.npm.levels, winstonSlack, 'Should respond, pass variables and parse error stack', 'errorParsing');
    _results = [];
    for (_j = 0, _len1 = arrErrorParsingLevels.length; _j < _len1; _j++) {
      test = arrErrorParsingLevels[_j];
      _results.push(it(test.name, test.fn));
    }
    return _results;
  });
  return describe('common tests', function() {
    var response;
    response = {};
    response.body = '';
    before(function() {
      return sinon.stub(winstonSlack.slack, 'request', function(data, done) {
        if (response.body !== 'ok') {
          return done(new Error(response.body));
        }
        return done();
      });
    });
    after(function() {
      return winstonSlack.slack.request.restore();
    });
    it('Should be instance of winston-slack-transport', function(done) {
      assert.instanceOf(winstonSlack, winstonSlackClass);
      assert.isFunction(winstonSlack.log);
      return done();
    });
    it('Should throw error if webHookUrl not specified', function(done) {
      var options;
      options = _.clone(slackOptions, true);
      options.webHookUrl = void 0;
      expect(function() {
        new winstonSlackClass(options);
      }).to["throw"](Error);
      return done();
    });
    it('Should throw error if pid not specified', function(done) {
      var options;
      options = _.clone(slackOptions, true);
      options.pid = void 0;
      expect(function() {
        new winstonSlackClass(options);
      }).to["throw"](Error);
      return done();
    });
    it('Should response with "ok" if message successfully send', function(done) {
      response.body = 'ok';
      return winstonSlack.log('error', 'test message', {}, (function(_this) {
        return function(err, send) {
          expect(send).to.be.ok;
          return done();
        };
      })(this));
    });
    return it('Should response with "[ErrorSlack]" if message not send (connection problem)', function(done) {
      response.body = '[ErrorSlack]';
      return winstonSlack.log('error', 'test message', {}, (function(_this) {
        return function(err, send) {
          expect(send).to.not.be.ok;
          return done();
        };
      })(this));
    });
  });
});

//# sourceMappingURL=data:application/json;base64,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LFVBQUEsTUFBQSxDQUFPLElBQVAsQ0FBWSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQXZCLENBQUE7aUJBQ0EsSUFBQSxDQUFBLEVBRjRDO1FBQUEsRUFBQTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBOUMsRUFGaUY7SUFBQSxDQUFuRixFQTNDdUI7RUFBQSxDQUF6QixFQXhCd0M7QUFBQSxDQUExQyxDQS9FQSxDQUFBIiwiZmlsZSI6InRlc3QvaW5kZXguanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyJfICAgICAgICAgICA9IHJlcXVpcmUoJ2xvZGFzaCcpXG5mcyAgICAgICAgICA9IHJlcXVpcmUoJ2ZzJylcbmNoYWkgICAgICAgID0gcmVxdWlyZSgnY2hhaScpXG5wYXRoICAgICAgICA9IHJlcXVpcmUoJ3BhdGgnKVxuc2lub24gICAgICAgPSByZXF1aXJlKCdzaW5vbicpXG5zaW5vbkNoYWkgICA9IHJlcXVpcmUoJ3Npbm9uLWNoYWknKVxuYXNzZXJ0ICAgID0gY2hhaS5hc3NlcnRcbmV4cGVjdCAgICA9IGNoYWkuZXhwZWN0XG5cbmNoYWkudXNlKHNpbm9uQ2hhaSlcblxud2luc3RvbiA9IHJlcXVpcmUoJ3dpbnN0b24nKVxud2luc3RvblNsYWNrQ2xhc3MgPSByZXF1aXJlKCcuLi9saWInKVxuXG5yYXdFcnJvciA9IGZzLnJlYWRGaWxlU3luYyAnLi90ZXN0L3NhbXBsZV9lcnJvcl9yYXcudHh0JywgJ3V0ZjgnXG5wYXJzZWRFcnJvciA9IGZzLnJlYWRGaWxlU3luYyAnLi90ZXN0L3NhbXBsZV9lcnJvcl9wYXJzZWQudHh0JywgJ3V0ZjgnXG5cblxuI2FsbCBvcHRpb25zIGlzIHJhbmRvbVxuc2xhY2tPcHRpb25zID1cbiAgd2ViSG9va1VybDogJ2h0dHBzOi8vaG9va3Muc2xhY2suY29tL3NlcnZpY2VzL0YwVTdLY0lnNnd0RlRtVWk3WndXREc5Zm1jaG50MnU0MHdFZ1c1eGFpOW80J1xuICBjaGFubmVsOiAnI3NhbXBsZWNoYW5uZWwnXG4gIHVzZXJuYW1lOiAnRXJyb3JCb3QnXG4gIGxldmVsOiAnZXJyb3InXG4gIHBpZDogcHJvY2Vzcy5waWRcbiAgYXBwOiBwYXRoLmJhc2VuYW1lKHByb2Nlc3MuYXJndlsxXSwgJy5qcycpXG5cbndpbnN0b25TbGFjayA9IG5ldyB3aW5zdG9uU2xhY2tDbGFzcyBzbGFja09wdGlvbnNcblxudGVzdFR5cGVzID0gWydub3JtYWwnLCdlcnJvclBhcnNpbmcnXVxuXG50ZXN0TGV2ZWxzID0gKGxldmVscywgdHJhbnNwb3J0LCBhc3NlcnRNc2csIHRlc3RUeXBlKSAtPlxuICB0ZXN0cyA9IFtdXG4gIE9iamVjdC5rZXlzKGxldmVscykuZm9yRWFjaCAobGV2ZWwsIGluZGV4KSAtPlxuICAgIHRlc3RzLnB1c2hcbiAgICAgIG5hbWU6IFwiI3thc3NlcnRNc2d9IHdpdGggdGhlICcje2xldmVsfScgbGV2ZWxcIlxuICAgICAgZm46IChkb25lKSAtPlxuICAgICAgICB0ZXN0VHlwZSA9ICdub3JtYWwnIHVubGVzcyB0ZXN0VHlwZT9cblxuICAgICAgICBsb2dPcHRpb25zID0ge31cbiAgICAgICAgbG9nT3B0aW9ucy5sZXZlbCA9IGxldmVsXG4gICAgICAgIGxvZ09wdGlvbnMubXNnID0gJ3Rlc3QgbWVzc2FnZSdcbiAgICAgICAgbG9nT3B0aW9ucy5tZXRhID0ge31cblxuICAgICAgICBpZih0ZXN0VHlwZSA9PSAnZXJyb3JQYXJzaW5nJylcbiAgICAgICAgICBsb2dPcHRpb25zLm1ldGEgPSB7ZXJyb3JTdGFjazogcmF3RXJyb3J9XG4gICAgICAgIFxuICAgICAgICBzZW5kT3B0aW9ucyA9IHt9XG4gICAgICAgIHNlbmRPcHRpb25zLmNoYW5uZWwgPSBzbGFja09wdGlvbnMuY2hhbm5lbFxuICAgICAgICBzZW5kT3B0aW9ucy51c2VybmFtZSA9IHNsYWNrT3B0aW9ucy51c2VybmFtZVxuICAgICAgICBzZW5kT3B0aW9ucy50ZXh0ID0gXCIqI3tsb2dPcHRpb25zLm1zZ30qXCJcblxuICAgICAgICBpZih0ZXN0VHlwZSA9PSAnZXJyb3JQYXJzaW5nJylcbiAgICAgICAgICBzZW5kT3B0aW9ucy50ZXh0ID0gXCIqI3tsb2dPcHRpb25zLm1zZ30qXFxuI3twYXJzZWRFcnJvcn1cIlxuXG4gICAgICAgIHRyYW5zcG9ydC5sb2cgbG9nT3B0aW9ucy5sZXZlbCwgbG9nT3B0aW9ucy5tc2csIGxvZ09wdGlvbnMubWV0YSwgKGVycikgLT5cbiAgICAgICAgICBleHBlY3QodHJhbnNwb3J0LmxvZykudG8uaGF2ZS5iZWVuLmNhbGxlZFdpdGgobG9nT3B0aW9ucy5sZXZlbCwgbG9nT3B0aW9ucy5tc2csIGxvZ09wdGlvbnMubWV0YSlcblxuICAgICAgICAgIGlmKHRlc3RUeXBlID09ICdub3JtYWwnKVxuICAgICAgICAgICAgZXhwZWN0KHRyYW5zcG9ydC5sb2cuY2FsbENvdW50KS50by5lcXVhbChpbmRleCsxKVxuICAgICAgICAgICAgZXhwZWN0KHRyYW5zcG9ydC5zbGFjay5zZW5kLmNhbGxDb3VudCkudG8uZXF1YWwoaW5kZXgrMSlcblxuICAgICAgICAgICMgZ2V0IGFyZ3MgZnJvbSBzbGFjay5zZW5kXG4gICAgICAgICAgc2VuZExhc3RDYWxsID0gdHJhbnNwb3J0LnNsYWNrLnNlbmQubGFzdENhbGxcblxuICAgICAgICAgIGV4cGVjdChzZW5kTGFzdENhbGwuYXJnc1swXS5jaGFubmVsKS50by5lcXVhbChzZW5kT3B0aW9ucy5jaGFubmVsKVxuICAgICAgICAgIGV4cGVjdChzZW5kTGFzdENhbGwuYXJnc1swXS51c2VybmFtZSkudG8uZXF1YWwoc2VuZE9wdGlvbnMudXNlcm5hbWUpXG4gICAgICAgICAgZXhwZWN0KHNlbmRMYXN0Q2FsbC5hcmdzWzBdLnRleHQpLnRvLmVxdWFsKHNlbmRPcHRpb25zLnRleHQpXG5cbiAgICAgICAgICBzZW5kTGFzdENhbGwuYXJnc1swXS5hdHRhY2htZW50c1swXS5maWVsZHMuZm9yRWFjaCAoZmllbGQpIC0+XG4gICAgICAgICAgICBleHBlY3QoZmllbGQpLnRvLmNvbnRhaW4ua2V5cyhbJ3RpdGxlJywgJ3ZhbHVlJ10pIGlmIGZpZWxkP1xuXG4gICAgICAgICAgZG9uZSgpXG5cbiAgcmV0dXJuIHRlc3RzXG5cblxuIyMjICMjI1xuIyBURVNUU1xuZGVzY3JpYmUgJ3dpbnN0b24tc2xhY2stdHJhbnNwb3J0IHRlc3RzJywgKCkgLT5cblxuICBiZWZvcmUgLT5cbiAgICBzaW5vbi5zcHkgd2luc3RvblNsYWNrLnNsYWNrLCAnc2VuZCdcbiAgICBzaW5vbi5zcHkgd2luc3RvblNsYWNrLCAnbG9nJ1xuXG4gIGRlc2NyaWJlICdsZXZlbHMgdGVzdHMnLCAoKSAtPlxuXG4gICAgYmVmb3JlIC0+XG4gICAgICBzaW5vbi5zdHViIHdpbnN0b25TbGFjay5zbGFjaywgJ3JlcXVlc3QnLCAoZGF0YSwgZG9uZSkgLT5cbiAgICAgICAgZG9uZSgpXG5cbiAgICBhZnRlciAtPlxuICAgICAgKHdpbnN0b25TbGFjay5zbGFjaykucmVxdWVzdC5yZXN0b3JlKClcblxuICAgIGFyclRlc3RMZXZlbHMgPSB0ZXN0TGV2ZWxzIHdpbnN0b24uY29uZmlnLm5wbS5sZXZlbHMsIHdpbnN0b25TbGFjaywgJ1Nob3VsZCByZXNwb25kIGFuZCBwYXNzIHZhcmlhYmxlcydcbiAgICBmb3IgdGVzdCBpbiBhcnJUZXN0TGV2ZWxzXG4gICAgICBpdCB0ZXN0Lm5hbWUsIHRlc3QuZm5cblxuICAgIGFyckVycm9yUGFyc2luZ0xldmVscyA9IHRlc3RMZXZlbHMgd2luc3Rvbi5jb25maWcubnBtLmxldmVscywgd2luc3RvblNsYWNrLCAnU2hvdWxkIHJlc3BvbmQsIHBhc3MgdmFyaWFibGVzIGFuZCBwYXJzZSBlcnJvciBzdGFjaycsICdlcnJvclBhcnNpbmcnXG4gICAgZm9yIHRlc3QgaW4gYXJyRXJyb3JQYXJzaW5nTGV2ZWxzXG4gICAgICBpdCB0ZXN0Lm5hbWUsIHRlc3QuZm5cblxuICBcbiAgZGVzY3JpYmUgJ2NvbW1vbiB0ZXN0cycsICgpIC0+XG5cbiAgICByZXNwb25zZSA9IHt9XG4gICAgcmVzcG9uc2UuYm9keSA9ICcnXG5cbiAgICBiZWZvcmUgLT5cbiAgICAgIHNpbm9uLnN0dWIgd2luc3RvblNsYWNrLnNsYWNrLCAncmVxdWVzdCcsIChkYXRhLCBkb25lKSAtPlxuICAgICAgICBpZiByZXNwb25zZS5ib2R5IGlzbnQgJ29rJ1xuICAgICAgICAgIHJldHVybiBkb25lKG5ldyBFcnJvcihyZXNwb25zZS5ib2R5KSlcbiAgICAgICAgZG9uZSgpXG5cbiAgICBhZnRlciAtPlxuICAgICAgKHdpbnN0b25TbGFjay5zbGFjaykucmVxdWVzdC5yZXN0b3JlKClcblxuICAgIGl0ICdTaG91bGQgYmUgaW5zdGFuY2Ugb2Ygd2luc3Rvbi1zbGFjay10cmFuc3BvcnQnLCAoZG9uZSkgLT5cbiAgICAgIGFzc2VydC5pbnN0YW5jZU9mIHdpbnN0b25TbGFjaywgd2luc3RvblNsYWNrQ2xhc3NcbiAgICAgIGFzc2VydC5pc0Z1bmN0aW9uIHdpbnN0b25TbGFjay5sb2dcbiAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ1Nob3VsZCB0aHJvdyBlcnJvciBpZiB3ZWJIb29rVXJsIG5vdCBzcGVjaWZpZWQnLCAoZG9uZSkgLT5cbiAgICAgIG9wdGlvbnMgPSBfLmNsb25lKHNsYWNrT3B0aW9ucywgdHJ1ZSlcbiAgICAgIG9wdGlvbnMud2ViSG9va1VybCA9IHVuZGVmaW5lZFxuICAgICAgZXhwZWN0KCgpLT5cbiAgICAgICAgbmV3IHdpbnN0b25TbGFja0NsYXNzKG9wdGlvbnMpXG4gICAgICAgIHJldHVyblxuICAgICAgKS50by50aHJvdyhFcnJvcilcbiAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ1Nob3VsZCB0aHJvdyBlcnJvciBpZiBwaWQgbm90IHNwZWNpZmllZCcsIChkb25lKSAtPlxuICAgICAgb3B0aW9ucyA9IF8uY2xvbmUoc2xhY2tPcHRpb25zLCB0cnVlKVxuICAgICAgb3B0aW9ucy5waWQgPSB1bmRlZmluZWRcbiAgICAgIGV4cGVjdCgoKS0+XG4gICAgICAgIG5ldyB3aW5zdG9uU2xhY2tDbGFzcyhvcHRpb25zKVxuICAgICAgICByZXR1cm5cbiAgICAgICkudG8udGhyb3coRXJyb3IpXG4gICAgICBkb25lKClcblxuICAgIGl0ICdTaG91bGQgcmVzcG9uc2Ugd2l0aCBcIm9rXCIgaWYgbWVzc2FnZSBzdWNjZXNzZnVsbHkgc2VuZCcsIChkb25lKSAtPlxuICAgICAgcmVzcG9uc2UuYm9keSA9ICdvaydcbiAgICAgIHdpbnN0b25TbGFjay5sb2cgJ2Vycm9yJywgJ3Rlc3QgbWVzc2FnZScsIHt9LCAoZXJyLCBzZW5kKSA9PlxuICAgICAgICBleHBlY3Qoc2VuZCkudG8uYmUub2tcbiAgICAgICAgZG9uZSgpXG4gICAgICAgIFxuICAgIGl0ICdTaG91bGQgcmVzcG9uc2Ugd2l0aCBcIltFcnJvclNsYWNrXVwiIGlmIG1lc3NhZ2Ugbm90IHNlbmQgKGNvbm5lY3Rpb24gcHJvYmxlbSknLCAoZG9uZSkgLT5cbiAgICAgIHJlc3BvbnNlLmJvZHkgPSAnW0Vycm9yU2xhY2tdJ1xuICAgICAgd2luc3RvblNsYWNrLmxvZyAnZXJyb3InLCAndGVzdCBtZXNzYWdlJywge30sIChlcnIsIHNlbmQpID0+XG4gICAgICAgIGV4cGVjdChzZW5kKS50by5ub3QuYmUub2tcbiAgICAgICAgZG9uZSgpXG4gICAgICAgIFxuXG5cbiJdfQ==