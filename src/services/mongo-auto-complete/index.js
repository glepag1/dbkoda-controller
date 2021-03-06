/*
 * dbKoda - a modern, open source code editor, for MongoDB.
 * Copyright (C) 2017-2018 Southbank Software
 *
 * This file is part of dbKoda.
 *
 * dbKoda is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * dbKoda is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with dbKoda.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * @Author: joey
 * @Date:   2016-12-23T13:05:45+11:00
 * @Last modified by:   guiguan
 * @Last modified time: 2017-06-08T18:00:43+10:00
 */

const hooks = require('./hooks');

class AutoCompleteService {
  constructor(options) {
    this.options = options || {};
    this.docs = {
      description: 'A service to create mongo shell and execute command',
      find: {
        description: 'Get all opening shells',
      },
      get: {
        description: 'Execute auto complete on mongo-shell',
        parameters: [
          {
            in: 'query',
            required: true,
            name: 'id',
            type: 'string',
          },
          {
            in: 'query',
            required: true,
            name: 'shellId',
            type: 'string',
          },
          {
            in: 'query',
            required: true,
            name: 'command',
            type: 'string',
          },
        ],
      },
    };
  }

  setup(app) {
    this.controller = app.service('mongo/auto-complete/controller');
    // this.controller = app.service('mongo/connection/controller');
  }

  /**
   * run command auto complete.
   */
  get(id, params) {
    l.info('run auto complete on shell ', id, params);
    return this.controller.autoComplete(id, params.query.shellId, params.query.command);
  }
}

module.exports = function() {
  const app = this;

  // Initialize our service with any options it requires
  const service = new AutoCompleteService();
  app.use('/mongo-auto-complete', service);

  // Get our initialize service to that we can bind hooks
  const mongoService = app.service('/mongo-auto-complete');

  // Set up our before hooks
  mongoService.before(hooks.before);

  // Set up our after hooks
  mongoService.after(hooks.after);
  return service;
};

module.exports.AutoCompleteService = AutoCompleteService;
