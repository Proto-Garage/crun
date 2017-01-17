/* globals Util */
import {expect} from 'chai';
import Command from '../lib/command';
import {default as Group, extractStatus} from '../lib/group';
import rand from 'rand-token';
import _ from 'lodash';

describe('Group', function() {
  this.timeout(20000);

  describe('Series', function() {
    it('should run group', function * () {
      let command = new Command({
        command: [
          'echo "start"',
          'sleep 1',
          'echo "end"'
        ].join(' && ')
      });

      let group = new Group({
        name: 'group ' + rand.generate(8),
        queue: 'global',
        executionType: 'series',
        members: [command]
      });

      let timestamp = Date.now();
      let str = '';
      command.stdout.on('data', function(data) {
        str += data;
      });
      yield group.run();

      expect(str).to.equal('start\nend\n');
      expect(Date.now() - timestamp).to.above(1000);
      expect(Date.now() - timestamp).to.below(1500);
    });

    it('should run group', function * () {
      const NUM_COMMANDS = 5;

      let commands = _.map(_.range(NUM_COMMANDS), () => new Command({
        command: [
          'echo "start"',
          'sleep 1',
          'echo "end"'
        ].join(' && ')
      }));

      let group = new Group({
        name: 'group ' + rand.generate(8),
        queue: 'global',
        executionType: 'series',
        members: commands
      });

      let timestamp = Date.now();
      _.each(commands, command => {
        command.result = '';
        command.stdout.on('data', function(data) {
          command.result += data;
        });
      });
      yield group.run();

      _.each(commands, command => {
        expect(command.result).to.equal('start\nend\n');
      });

      expect(Date.now() - timestamp).to.above(NUM_COMMANDS * 1000);
      expect(Date.now() - timestamp).to.below(NUM_COMMANDS * 1000 + 500);
    });
  });

  describe('Parallel', function() {
    it('should run group', function * () {
      const NUM_COMMANDS = 5;

      let commands = _.map(_.range(NUM_COMMANDS), () => new Command({
        command: [
          'echo "start"',
          'sleep 1',
          'echo "end"'
        ].join(' && ')
      }));

      let group = new Group({
        name: 'group ' + rand.generate(8),
        queue: 'global',
        executionType: 'parallel',
        members: commands
      });

      let timestamp = Date.now();
      _.each(commands, command => {
        command.result = '';
        command.stdout.on('data', function(data) {
          command.result += data;
        });
      });
      yield group.run();

      _.each(commands, command => {
        expect(command.result).to.equal('start\nend\n');
      });

      expect(Date.now() - timestamp).to.above(1000);
      expect(Date.now() - timestamp).to.below(1500);
    });
  });

  describe('Nested', function() {
    it('should run group', function * () {
      const NUM_COMMANDS = 3;

      let commands = _.map(_.range(NUM_COMMANDS), index => new Command({
        command: [
          'echo "start"',
          `echo "command ${index}"`,
          'sleep 1',
          'echo "end"'
        ].join(' && ')
      }));

      let groupOne = new Group({
        name: 'group ' + rand.generate(8),
        executionType: 'parallel',
        members: _.tail(commands)
      });

      let groupTwo = new Group({
        name: 'group ' + rand.generate(8),
        executionType: 'series',
        members: [_.first(commands), groupOne]
      });

      _.each(commands, command => {
        command.result = '';
        command.stdout.on('data', function(data) {
          command.result += data;
        });
      });

      let timestamp = Date.now();
      yield groupTwo.run();

      _.each(commands, (command, index) => {
        expect(command.result).to.equal(`start\ncommand ${index}\nend\n`);
      });

      expect(Date.now() - timestamp).to.above(2000);
      expect(Date.now() - timestamp).to.below(2500);
    });

    it('should queue groups', function * () {
      const NUM_COMMANDS = 4;

      let commands = _.map(_.range(NUM_COMMANDS), index => new Command({
        command: [
          'echo "start"',
          `echo "command ${index}"`,
          'sleep 1',
          'echo "end"'
        ].join(' && ')
      }));

      let groups = _.map(commands, command => {
        return new Group({
          name: 'group ' + rand.generate(8),
          queue: 'local',
          members: [command]
        });
      });

      let group = new Group({
        name: 'group ' + rand.generate(8),
        queue: 'global',
        executionType: 'parallel',
        members: groups
      });

      let timestamp = Date.now();
      yield group.run();

      expect(Date.now() - timestamp).to.above(4000);
      expect(Date.now() - timestamp).to.below(4500);
    });
  });

  describe('Status', function() {
    it('should extract status', function * () {
      const NUM_COMMANDS = 3;

      let commands = _.map(_.range(NUM_COMMANDS), index => new Command({
        command: [
          'echo "start"',
          `echo "command ${index}"`,
          'sleep 1',
          'echo "end"'
        ].join(' && ')
      }));

      let groupOne = new Group({
        name: 'group ' + rand.generate(8),
        executionType: 'parallel',
        members: _.tail(commands)
      });

      let groupTwo = new Group({
        name: 'group ' + rand.generate(8),
        executionType: 'series',
        members: [_.first(commands), groupOne]
      });

      let status = extractStatus(groupTwo);
      expect(status).to.deep.equal({
        status: 'PENDING',
        startedAt: null,
        elapsedTime: null,
        type: 'group',
        executionType: 'series',
        members: [{
          status: 'PENDING',
          startedAt: null,
          elapsedTime: null,
          type: 'command'
        }, {
          status: 'PENDING',
          startedAt: null,
          elapsedTime: null,
          type: 'group',
          executionType: 'parallel',
          members: [{
            status: 'PENDING',
            startedAt: null,
            elapsedTime: null,
            type: 'command'
          }, {
            status: 'PENDING',
            startedAt: null,
            elapsedTime: null,
            type: 'command'
          }]
        }]
      });

      yield [function * () {
        yield groupTwo.run();
      }, function * () {
        yield Util.delay(500);
        let status = extractStatus(groupTwo);
        expect(status).to.has.deep.property('status', 'STARTED');
        expect(status).to.has.deep.property('members[0].status', 'STARTED');
        expect(status).to.has.deep.property('members[1].status', 'PENDING');
        expect(status).to.has.deep
          .property('members[1].members[0].status', 'PENDING');
        expect(status).to.has.deep
          .property('members[1].members[1].status', 'PENDING');

        yield Util.delay(1000);
        status = extractStatus(groupTwo);
        expect(status).to.has.deep.property('status', 'STARTED');
        expect(status).to.has.deep.property('members[0].status', 'SUCCEEDED');
        expect(status).to.has.deep.property('members[1].status', 'STARTED');
        expect(status).to.has.deep
          .property('members[1].members[0].status', 'STARTED');
        expect(status).to.has.deep
          .property('members[1].members[1].status', 'STARTED');

        yield Util.delay(1000);
        status = extractStatus(groupTwo);
        expect(status).to.has.deep.property('status', 'SUCCEEDED');
        expect(status).to.has.deep.property('members[0].status', 'SUCCEEDED');
        expect(status).to.has.deep.property('members[1].status', 'SUCCEEDED');
        expect(status).to.has.deep
          .property('members[1].members[0].status', 'SUCCEEDED');
        expect(status).to.has.deep
          .property('members[1].members[1].status', 'SUCCEEDED');
      }];
    });
  });
});
