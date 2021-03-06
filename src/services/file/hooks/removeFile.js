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
 * @Author: guiguan
 * @Date:   2017-04-30T17:20:56+10:00
 * @Last modified by:   guiguan
 * @Last modified time: 2017-05-01T00:32:46+10:00
 */

import errors from 'feathers-errors';
import { getItems } from 'feathers-hooks-common';
import fs from 'fs';

export default _options => (hook) => {
  let items = getItems(hook);
  const isArray = Array.isArray(items);
  items = isArray ? items : [items];
  const watcher = hook.service.watcher;

  const processItem = (item) => {
    const { _id } = item;

    watcher.unwatch(_id);

    return new Promise((resolve) => {
      try {
        fs.unlink(_id, (err) => {
          if (err) {
            return resolve(
              new errors.Unprocessable(err.message, {
                _id
              })
            );
          }
          resolve({ _id });
        });
      } catch (err) {
        return resolve(
          new errors.Unprocessable(err.message, {
            _id
          })
        );
      }
    });
  };

  return Promise.all(items.map(processItem)).then((results) => {
    if (isArray && results.length > 1) {
      hook.result = results;
    } else {
      hook.result = results[0];
      if (hook.result instanceof Error) {
        throw hook.result;
      }
    }
    return hook;
  });
};
