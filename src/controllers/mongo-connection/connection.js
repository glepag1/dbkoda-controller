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
 * mongo connection object
 */
class MongoConnection {

  constructor(id, driver, status, conn, dbVersion, shellVersion) {
    this.id = id;
    this.driver = driver;
    this.shells = {};
    this.status = status;
    this.url = conn.url;
    this.ssl = conn.ssl;
    this.username = conn.username;
    this.password = conn.password;
    this.dbVersion = dbVersion;
    this.shellVersion = shellVersion;
    this.hosts = conn.hosts;
    this.options = conn.options;
    this.database = conn.database;
    this.connectionParameters = conn;
    this.requireSlaveOk = conn.requireSlaveOk;
  }

  getShell(shellId) {
    return this.shells[shellId];
  }

  addShell(shellId, shell) {
    this.shells[shellId] = shell;
  }
}

module.exports = MongoConnection;