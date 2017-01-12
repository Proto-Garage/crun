import {expect} from 'chai';
import Command from '../lib/command';

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
