/**
 * @Last modified by:   guiguan
 * @Last modified time: 2017-11-23T16:54:53+11:00
 *
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

const { EventEmitter } = require('events');
const MongoDBHeartBeat = require('./mongodb-heartbeat');

class MongoDBMonitor extends EventEmitter {
  constructor(connection) {
    super();
    this.connection = connection;
    this.timer = null;
    this.heartbeat = new MongoDBHeartBeat(connection);
  }

  start() {
    l.info('start mongodb monitor.');
    const that = this;
    this.heartbeat.start();
    this.heartbeat.on('error', (err) => {
      l.error('heartbeat error ', err);
      that.emit('error', err);
    });

    this.heartbeat.on('heartbeat', (data) => {
      l.debug('heartbeat ', data);
    });
  }

  stop() {
    this.heartbeat.stop();
  }
}
module.exports = MongoDBMonitor;
