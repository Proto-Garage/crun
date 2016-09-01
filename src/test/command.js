import {expect} from 'chai';
import Command from '../lib/command';
import Group from '../lib/group';
import _ from 'lodash';

describe('Command', function() {
  this.timeout(20000);

  describe('Given default options', function() {
    it('should run command', function * () {
      let command = new Command({
        command: [
          'echo "start"',
          'sleep 2',
          'echo "middle"',
          'sleep 2',
          'echo "stop"'
        ].join(' && ')
      });

      let timestamp = Date.now();
      let str = '';
      command.stdout.on('data', function(data) {
        str += data;
      });

      yield command.run();

      expect(str).to.equal('start\nmiddle\nstop\n');
      expect(Date.now() - timestamp).to.above(4000);
      expect(Date.now() - timestamp).to.below(4500);
    });
  });

  describe('Given invalid command', function() {
    it('should throw error', function * () {
      let command = new Command({
        command: 'crun'
      });

      let done = command.run();
      let str = '';
      command.process.stderr.on('data', function(data) {
        str += data;
      });

      try {
        yield done;
      } catch (err) {
        expect(err.code).to.equal(127);
      }

      expect(str.indexOf('crun: not found')).to.above(-1);
      expect(command.status).to.equal('FAILED');
    });
  });
});

describe('Group', function() {
  this.timeout(20000);

  describe('Given default options', function() {
    it('should run group', function * () {
      let command = new Command({
        command: [
          'echo "start"',
          'sleep 2',
          'echo "stop"'
        ].join(' && ')
      });

      let timestamp = Date.now();
      let group = new Group({
        type: 'command',
        command
      });

      let str = '';
      command.stdout.on('data', function(data) {
        str += data;
      });
      yield group.run();

      expect(str).to.equal('start\nstop\n');
      expect(Date.now() - timestamp).to.above(2000);
      expect(Date.now() - timestamp).to.below(2500);
    });

    it('should run group', function * () {
      let commands = [new Command({
        command: [
          'echo "1"',
          'sleep 2',
          'echo "2"'
        ].join(' && ')
      }), new Command({
        command: [
          'echo "3"',
          'sleep 2',
          'echo "4"'
        ].join(' && ')
      })];

      let timestamp = Date.now();
      let group = new Group({
        type: 'serial',
        groups: _.map(commands, command => {
          return new Group({
            type: 'command',
            command
          });
        })
      });

      yield group.run();

      expect(Date.now() - timestamp).to.above(4000);
      expect(Date.now() - timestamp).to.below(4500);
    });

    it('should run group', function * () {
      let commands = [new Command({
        command: [
          'echo "1"',
          'sleep 2',
          'echo "2"'
        ].join(' && ')
      }), new Command({
        command: [
          'echo "3"',
          'sleep 2',
          'echo "4"'
        ].join(' && ')
      })];

      let timestamp = Date.now();
      let group = new Group({
        type: 'parallel',
        groups: _.map(commands, command => {
          return new Group({
            type: 'command',
            command
          });
        })
      });

      yield group.run();

      expect(Date.now() - timestamp).to.above(2000);
      expect(Date.now() - timestamp).to.below(2500);
    });
  });
});
