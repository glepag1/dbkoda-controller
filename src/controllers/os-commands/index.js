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
 * Created by joey on 21/7/17.
 */
import {loadCommands} from '../../config';

const spawn = require('child_process').spawn;
const stringArgv = require('string-argv');

const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;

const findCommandParameters = (cmd) => {
  let params = stringArgv(cmd.trim());
  params = _.filter(params, o => o !== '');
  return params;
};

class OSCommandsController extends EventEmitter {

  constructor() {
    super();
    this.requestQueue = [];
    this.currentProcess = null;
  }

  runCommand(connect, commands, shellId) {
    const cmds = commands.split('\n');
    log.info('run os command ', cmds);
    if (cmds) {
      cmds.map(c => c && this.requestQueue.push({connect, cmd: c, shellId}));
    }
    this.runCommandFromQueue();
    return Promise.resolve({});
  }

  runCommandFromQueue() {
    const configObj = loadCommands();
    log.info('Mongo Cmd:', configObj);
    if (this.requestQueue.length <= 0) {
      return;
    }
    const {connect, shellId} = this.requestQueue[0];
    let {cmd} = this.requestQueue[0];
    const id = connect.id;
    const {username, password} = connect;
    this.requestQueue.shift();
    if (username && password) {
      cmd = cmd.replace('-p ******', `-p ${password}`);
    }
    const params = findCommandParameters(cmd);
    const mongoCmd = configObj[params[0] + 'Cmd'] ? configObj[params[0] + 'Cmd'] : params[0];
    params.splice(0, 1);
    const p = spawn(mongoCmd, params);
    this.currentProcess = {process: p, cmd};
    p.stdout.on('data', (data) => {
      log.debug(`stdout: ${data}`);
      this.emit(OSCommandsController.COMMAND_OUTPUT_EVENT, {id, shellId, output: data.toString('utf8')});
    });

    p.stderr.on('data', (data) => {
      log.debug(`stderr: ${data}`);
      this.emit(OSCommandsController.COMMAND_OUTPUT_EVENT, {id, shellId, output: data.toString('utf8')});
    });

    p.on('close', (code) => {
      log.debug(`child process exited with code ${code}`);
      if (this.requestQueue.length <= 0) {
        this.emit(OSCommandsController.COMMAND_FINISH_EVENT, {
          id,
          shellId,
          output: `child process exited with code ${code}`,
          cmd,
          code
        });
      }
      this.runCommandFromQueue();
    });
  }

  killCurrentProcess() {
    this.requestQueue = [];
    if (this.currentProcess) {
      this.currentProcess.process.kill();
    }
    return Promise.resolve();
  }
}

module.exports.OSCommandsController = OSCommandsController;
module.exports.findCommandParameters = findCommandParameters;

OSCommandsController.COMMAND_OUTPUT_EVENT = 'os-command-output';
OSCommandsController.COMMAND_FINISH_EVENT = 'os-command-finish';
