import {expect} from 'chai';
import Command from '../lib/command';
import Group from '../lib/group';
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
        queue: 'global',
        executionType: 'parallel',
        members: _.tail(commands)
      });

      let groupTwo = new Group({
        name: 'group ' + rand.generate(8),
        queue: 'global',
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
  });
});
