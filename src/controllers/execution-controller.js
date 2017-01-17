/* globals Execution, AppError */
import _ from 'lodash';
import url from 'url';
import qs from 'querystring';
import {buildGroup, extractStatus} from '../lib/group';
import co from 'co';
import STATUS from '../lib/status';

import mongoose from 'mongoose';

let executions = {};

let ObjectId = mongoose.Types.ObjectId;

export let ExecutionController = {
  create: function * () {
    let params = _.pick(this.request.body, [
      'group'
    ]);
    params.creator = this.user;

    if (!ObjectId.isValid(params.group)) {
      throw new AppError('INVALID_REQUEST',
        `${params.group} is not a valid ObjectId.`);
    }

    let group = yield buildGroup(params.group);

    let execution = new Execution(params);
    yield execution.save();

    let executionId = execution._id.toHexString();
    this.body = {
      uri: url.resolve(this.baseUrl, '/executions/' + executionId),
      _id: executionId
    };
    this.status = 201;

    executions[executionId] = group;

    co(function * () {
      let promise = new Promise(function(resolve) {
        executions[executionId].on('status', status => {
          let update = extractStatus(executions[executionId]);
          Execution.update({_id: executionId}, {status: update})
            .exec()
            .then(function() {
              if (status === STATUS.SUCCEEDED || status === STATUS.FAILED) {
                resolve();
              }
            });
        });
      });

      yield executions[executionId].run();
      yield promise;
    }).then(function() {
      delete executions[executionId];
    }).catch(err => {
      console.error(err);
    });
  },
  findOne: function * () {
    let execution = yield Execution
      .findOne({_id: this.params.id, creator: this.user})
      .select({createdAt: 1, status: 1})
      .lean(true)
      .exec();

    if (!execution) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} execution does not exist.`);
    }

    let executionId = execution._id.toHexString();
    if (executions[executionId]) {
      execution.status = extractStatus(executions[executionId]);
    }

    this.body = {
      links: {
        self: url.resolve(this.baseUrl, '/execution/' + this.params.id)
      },
      data: _.omit(execution, '_id')
    };
  },
  find: function * () {
    let limit = Number.parseInt(this.query.limit, 10) || 10;
    let skip = Number.parseInt(this.query.skip, 10) || 0;

    let query = {creator: this.user};

    let count = yield Execution.where(query).count();

    if (skip >= count) {
      this.body = {
        links: {},
        data: []
      };
    }

    let data = yield Execution
      .find(query)
      .select({createdAt: 1, group: 1, status: 1})
      .sort({createdAt: -1})
      .skip(skip)
      .limit(limit)
      .lean(true)
      .exec();

    _.each(data, execution => {
      let executionId = execution._id.toHexString();
      if (executions[executionId]) {
        execution.status = extractStatus(executions[executionId]);
      }
    });

    let links = {
      self: url.resolve(this.baseUrl, '/executions') +
        '?' + qs.stringify({limit, skip}),
      last: url.resolve(this.baseUrl, '/executions') +
        '?' + qs.stringify({
          limit: count % limit,
          skip: Math.floor(count / limit) * limit
        })
    };

    if ((limit + skip) < count) {
      links.next = url.resolve(this.baseUrl, '/executions') +
        '?' + qs.stringify({limit, skip: limit + skip});
    }

    this.body = {
      links,
      data: _.map(data, execution => {
        execution.uri = url.resolve(this.baseUrl,
          '/executions/' + execution._id);
        return execution;
      })
    };
  }
};
