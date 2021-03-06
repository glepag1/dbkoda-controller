//
//  * dbKoda - a modern, open source code editor, for MongoDB.
//  * Copyright (C) 2017-2018 Southbank Software  *
//  * This file is part of dbKoda.  *
//  * dbKoda is free software: you can redistribute it and/or modify
//  * it under the terms of the GNU Affero General Public License as
//  * published by the Free Software Foundation, either version 3 of the
//  * License, or (at your option) any later version.  *
//  * dbKoda is distributed in the hope that it will be useful,
//  * but WITHOUT ANY WARRANTY; without even the implied warranty of
//  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  * GNU Affero General Public License for more details.  *
//  * You should have received a copy of the GNU Affero General Public License
//  * along with dbKoda.  If not, see <http://www.gnu.org/licenses/>.

//
//
// Utility functions for index advisories
//

/* eslint no-var: 0 */
/* eslint no-prototype-builtins: 0 */
/* eslint camelcase: 0 */
/*  eslint prefer-arrow-callback: 0  */
/*  eslint object-shorthand: 0 */
/*  eslint vars-on-top: 0 */
/*  eslint dot-location: 0 */
/*  eslint no-loop-func: 0 */
/*  eslint no-undef: 0 */
/*  eslint no-plusplus: 0 */
/* eslint no-unused-vars: 0 */
/* eslint prefer-destructuring: 0 */
/* eslint no-restricted-globals: 0 */
/* eslint block-scoped-var: 0 */

var dbkInx = {};

dbkInx.debug = false;

dbkInx.quick_explain = function(explainPlan) {
  var stepNo = 1;
  var output = '';

  var printSpaces = function(n) {
    var s = '';
    for (var i = 1; i < n; i++) {
      s += ' ';
    }
    return s;
  };
  var printInputStage = function(step, depth) {
    if ('inputStage' in step) {
      printInputStage(step.inputStage, depth + 1);
    }
    if ('inputStages' in step) {
      step.inputStages.forEach(function(inputStage) {
        printInputStage(inputStage, depth + 1);
      });
    }
    var keys = [];
    if ('filter' in step) {
      if ('$and' in step.filter) {
        // Array of filter conditions
        step.filter.$and.forEach(function(filter) {
          keys.push(Object.keys(filter));
        });
      } else if ('$or' in step.filter) {
        // Array of filter conditions
        step.filter.$or.forEach(function(filter) {
          keys.push(Object.keys(filter));
        });
      } else if (!('$nor' in step.filter)) {
        keys.push(Object.keys(step.filter));
      }
    }
    if ('indexName' in step) {
      keys.push(step.indexName);
    }
    if ('sortPattern' in step) {
      Object.keys(step.sortPattern).forEach(function(skey) {
        keys.push(skey);
      });
    }
    output +=
      stepNo++ +
      ' ' +
      printSpaces(depth) +
      ' ' +
      step.stage +
      ' ' +
      keys +
      '\n';
  };

  printInputStage(explainPlan, 1);
  return output;
};

dbkInx.findNamespace = function(object) {
   return (dbkInx.findKeyValue('namespace', object));
};

dbkInx.findKeyValue = function(key, object) {
  // Find namespace within the plan (for instnace if this is a sharded plan)
    if (object.hasOwnProperty(key)) {
        return (object[key]);
    }

    for (var i = 0; i < Object.keys(object).length; i++) {
        if (typeof object[Object.keys(object)[i]] == 'object') {
            return dbkInx.findKeyValue(key, object[Object.keys(object)[i]]);
        }
    }
};

dbkInx.adviseAllCachedPlans = function() {
  db.getCollectionNames().forEach(function(collectionName) {
    // eslint-disable-line
    dbkInx.adviseCachedCollectionPlans(collectionName);
  });
};

dbkInx.adviseCachedCollectionPlans = function(collectionName) {
  var planCache = db.getCollection(collectionName).getPlanCache(); // eslint-disable-line
  planCache.listQueryShapes().forEach(function(shape) {
    planCache.getPlansByQuery(shape).forEach(function(plan) {
      var indexKeys = dbkInx.suggestIndexKeys(plan.reason.stats); // eslint-disable-line
      // printjson(indexKeys); // eslint-disable-line
    });
  });
};

dbkInx.adviseProfileQueries = function() {
  db.system.profile; // eslint-disable-line.
  find({ op: 'query' }).forEach(function(profile) {
    // eslint-disable-line eslint-disable-line
    if (dbkInx.debug) printjson(profile.query);
    // var indexKeys = dbkInx.suggestIndexKeys(profile.execStats);
    // printjson(indexKeys);
  });
};

dbkInx.createKeys = function(collection, indexes) {
  // printjson(indexes);
  indexes.forEach(function(index) {
    var result = db.getCollection(collection).createIndex(index);
    if (dbkInx.debug) printjson(result);
  });
  if (dbkInx.debug) {
    print('..... Allindexes');
    db.getCollection(collection).getIndexes().forEach(function(indx) {
      printjson(indx.key);
    });
  }
};

dbkInx.testPlans = function() {
  db.Sakila_films.dropIndexes(); // eslint-disable-line
  for (var i = 1; i <= 1; i++) {
    if (dbkInx.debug) print(1);
    var explain = db.Sakila_films.
      explain().
      find({ Category: 'Documentary', Rating: 'PG' }).
      sort({ Length: 1 }).
      next();
    dbkInx.createKeys("Sakila_films", dbkInx.suggestIndexKeys(explain)); // eslint-disable-line

    db.Sakila_films.createIndex({ Category: 1 }); // eslint-disable-line
    if (dbkInx.debug) print(2);
    explain = db.Sakila_films.
      explain().
      find({ Category: 'Documentary', Rating: 'PG' }).
      sort({ Length: 1 }).
      next();
    dbkInx.createKeys("Sakila_films", dbkInx.suggestIndexKeys(explain)); // eslint-disable-line

    db.Sakila_films.createIndex({ Rating: 1 }); // eslint-disable-line
    if (dbkInx.debug) print(3);
    explain = db.Sakila_films.
      explain().
      find({ Category: 'Documentary', Rating: 'PG' }).
      sort({ Length: 1 }).
      next();
    dbkInx.createKeys("Sakila_films", dbkInx.suggestIndexKeys(explain)); // eslint-disable-line
    // print('ITERATING THROUGH ALL PLANS');

    explain = db.Sakila_films.
      explain().
      find({ Category: 'Documentary', Rating: 'PG' }).
      next();
    // printjson(dbkInx.suggestIndexKeys(explain.queryPlanner.winningPlan)); //
    // eslint-disable-line
    explain = db.Sakila_films.
      explain().
      find({
        $or: [
          {
            Rating: 'PG'
          },
          {
            Category: 'Family'
          }
        ]
      }).
      next();
    dbkInx.createKeys("Sakila_films", dbkInx.suggestIndexKeys(explain)); // eslint-disable-line
    db.Sakila_films.createIndex({ Rating: 1 }); // eslint-disable-line
    db.Sakila_films.createIndex({ Category: 1 }); // eslint-disable-line
    if (dbkInx.debug) print(5);
    explain = db.Sakila_films.
      explain().
      find({
        $or: [
          {
            Rating: 'PG',
            'Rental Duration': '6'
          },
          {
            Category: 'Family',
            'Rental Duration': '6'
          }
        ]
      }).
      sort({ Length: 1 }).
      next();
    // printjson(explain); // eslint-disable-line
    // printjson(explain.queryPlanner.winningPlan);
    dbkInx.createKeys("Sakila_films", dbkInx.suggestIndexKeys(explain)); // eslint-disable-line
    explain = db.Sakila_films.
      explain().
      find({
        $or: [
          {
            Rating: 'PG',
            'Rental Duration': '6'
          },
          {
            Category: 'Family',
            'Rental Duration': '6'
          }
        ]
      }).
      sort({ Length: -1, Rating: 1 }).
      next();
    // printjson(explain); // eslint-disable-lin e
    // printjson(explain.queryPlanner.winningPlan);
    dbkInx.createKeys("Sakila_films", dbkInx.suggestIndexKeys(explain)); // eslint-disable-line
    // Second time through there should be no better index available.
    dbkInx.createKeys("Sakila_films", dbkInx.suggestIndexKeys(explain)); // eslint-disable-line

   var x = db.getSiblingDB('SampleCollections').getCollection('Sakila_films').find(
    { '$and':[
         { 'Title':{ $eq:'FRED' } },
         { 'Actors.Firstname':{ $eq:'JOE' } },
         { 'Category':{ $eq:'G' } }
        ] },
     { 'Title':1 }).sort({ 'Category':-1 }).explain();
  }
  // db.Sakila_films.dropIndexes(); // eslint-disable-line
};

dbkInx.suggestIndexKeys = function(explainPlan) {
  //
  // This function accepts an execution plan and generates an index definition
  // that would avoid COLLSCAN and Sort
  //
  // Only works when there are one level of nesting in conditions.  Eg You can't
  // nest $and within $or $or only generates a single index for $OR, where
  // multiple would be preferable

  var indId = 0;
  var indKeys = []; // Global for the filter recusive routine
  var projection = {};
  indKeys[0] = {};

  if (dbkInx.debug) {
    print(dbkInx.quick_explain(explainPlan.queryPlanner.winningPlan));
  } // Print explain summary if debug

  // Function to generate indexes to match a given filter
  filterParser = function(filter) {
    if (dbkInx.debug) {
      print('filterParser:');
      printjson(filter);
    }
    var firstArg = Object.keys(filter)[0];
    if (dbkInx.debug) print(firstArg);
    if (firstArg === '$or') {
      var orCount = 0;
      filter.$or.forEach(function(subfilter) {
        if (orCount > 0) {
          indId++; // New index for each OR condition
          indKeys[indId] = {};
        }
        filterParser(subfilter);
        orCount += 1;
      });
    } else if (firstArg === '$and') {
      filter.$and.forEach(function(subfilter) {
        filterParser(subfilter);
      });
    } else if (firstArg !== '$nor') {
      // Not equals can't be supported by index
      if (dbkInx.debug) print('filter', filter);
      var keys = Object.keys(filter);
      // printjson(filter);
      keys.forEach(function(key) {
        // printjson(key);
        indKeys[indId][key] = 1;
      });
    }
    return indKeys;
  };

  var checkInputStage = function(step, depth) {
    if (dbkInx.debug) print('Stage', step.stage);
    if ('inputStage' in step) {
      checkInputStage(step.inputStage, depth + 1);
    }
    if ('inputStages' in step) {
      step.inputStages.forEach(function(inputStage) {
        checkInputStage(inputStage, depth + 1);
      });
    }
    if ('shards' in step) {
       if (dbkInx.debug) print('Processing only first shard');
      checkInputStage(step.shards[0].winningPlan, depth + 1);
    }
    //
    // We should have got every index we need other than for a sort already.  Only
    // if a sort turns up do we need to add more keys
    //

    if (step.stage === 'SORT') {
      if (Object.keys(indKeys[0]).length === 0) {
        // no indexes yet, so just want one for the sort
        Object.keys(step.sortPattern).forEach(function(key) {
          indKeys[0][key] = step.sortPattern[key];
        });
      } else {
        Object.keys(step.sortPattern).forEach(function(key) {
          for (var idx = 0; idx < indKeys.length; idx += 1) {
            indKeys[idx][key] = step.sortPattern[key];
          }
        });
      }
    }
    if (step.stage === 'PROJECTION') {
      if ('transformBy' in step) {
        var includeProjection = true;
        Object.keys(step.transformBy).forEach(function(key) {
          // Only create indexes for "include"projections
          if (step.transformBy[key] === 0) includeProjection = false;
        });
        if (includeProjection) {
          projection = step.transformBy;
          if (dbkInx.debug) {
            print('Projection detected: ', JSON.stringify(projection));
          }
        }
      }
    }
  };
  var parsedQuery = dbkInx.findKeyValue('parsedQuery', explainPlan);
  if (dbkInx.debug) {
    print('parsedQuery:');
    printjson(parsedQuery);
  }
  var baseIndexes = filterParser(parsedQuery);
  // printjson(baseIndexes);
  checkInputStage(explainPlan.queryPlanner.winningPlan, 1);

  // Add projections to each index

  if (Object.keys(projection).length > 0) {
    for (var indI = 0; indI < indKeys.length; indI++) {
      Object.keys(projection).forEach(function(projKey) {
        if (!(projKey in indKeys[indI])) {
          // Index can't have same key twice
          indKeys[indI][projKey] = 1;
        }
      });
    }
  }

  if (dbkInx.debug) {
    print('Suggested Indexes');
    printjson(indKeys);
  }

  var indexes = dbkInx.existingIndexes(explainPlan);

  var advisedIndexes = [];
  indKeys.forEach(function(suggestedInx) {
    if (!dbkInx.checkForExistingIndex(indexes, suggestedInx)) {
      advisedIndexes.push(suggestedInx);
    }
  });

  return advisedIndexes;
};

// Existing indexes for the collection being explained
dbkInx.existingIndexes = function(explainPlan) {
  var dbName;
  var collectionName;
  var namespace;
  // Work out the dbName and the collectionName
  if ('namespace' in explainPlan.queryPlanner) { namespace = explainPlan.queryPlanner.namespace; } else { namespace = dbkInx.findNamespace(explainPlan); }
  if (namespace) {
        dbName = namespace.split('.')[0];
        collectionName = namespace.split('.')[1];
      var indexes = db.
    getSiblingDB(dbName).
    getCollection(collectionName).
    getIndexes();
  }
  if (dbkInx.debug) {
    print('dbName', dbName);
    print('collectionName', collectionName);
  }
  return (indexes);
};
//
// Function to check for an existing index or a index with the same leading keys
//
dbkInx.checkForExistingIndex = function(existingIndexes, proposedKeys) {
  var proposedLen = Object.keys(proposedKeys).length;
  var foundMatch = false;
  existingIndexes.forEach(function(index) {
    var adjustedKeys = {};
    // Each existing index
    var existKeys = Object.keys(index.key);
    var leadingKeys = existKeys.splice(0, proposedLen); // Slice down to the same number of keys
    leadingKeys.forEach(function(leadkey) {
      adjustedKeys[leadkey] = index.key[leadkey];
    });
    if (dbkInx.debug) {
      print(
        'Comparing proposed key ',
        JSON.stringify(proposedKeys),
        'to',
        JSON.stringify(adjustedKeys)
      );
    }
    if (JSON.stringify(adjustedKeys) === JSON.stringify(proposedKeys)) {
      if (dbkInx.debug) print('Matched');
      foundMatch = true;
    }
  });
  return foundMatch;
};

//
// This function looks for any indexes that will be made redundant by
// the proposed changes x
//
dbkInx.proposedRedundantIndexes = function(existingIndexes, proposedIndexes) {
  var redundantIndexes = [];
  proposedIndexes.forEach(function(proposedIndex) {
    // print('proposed',JSON.stringify(proposedIndex));
    existingIndexes.forEach(function(existingIndex) {
      // print('exist',JSON.stringify(existingIndex));
      var existingLen = Object.keys(existingIndex.key).length;
      // print ('len',existingLen);
      var matchKeys = dbkInx.firstElements(proposedIndex, existingLen);
      // print('match',JSON.stringify(matchKeys));
      if (JSON.stringify(matchKeys) === JSON.stringify(existingIndex.key)) {
        redundantIndexes.push({
          indexName: existingIndex.name,
          key: existingIndex.key,
          because: proposedIndex
        });
      }
    });
  });
  return redundantIndexes;
};

dbkInx.existingRedundantIndexes = function(existingIndexes) {
  var redundantIndexes = [];
  existingIndexes.forEach(function(index1) {
    // print('proposed',JSON.stringify(proposedIndex));
    existingIndexes.some(function(index2) {
      // print('exist',JSON.stringify(existingIndex));
      if (index1.name !== index2.name) {
        var existingLen = Object.keys(index1.key).length;
        // print ('len',existingLen);
        var matchKeys = dbkInx.firstElements(index2.key, existingLen);
        // print('match',JSON.stringify(matchKeys));
        if (JSON.stringify(matchKeys) === JSON.stringify(index1.key)) {
          redundantIndexes.push({
            indexName: index1.name,
            key: JSON.stringify(index1.key),
            becauseIndex: index2.name,
            becauseKeys: JSON.stringify(index2.key)
          });
          return (true);
        }
      }
    });
  });
  return redundantIndexes;
};

dbkInx.redundantDbIndexes = function(dbName) {
  var indexList = [];
  db.getSiblingDB(dbName).getCollectionNames().forEach(function(collection) {
    // print(collection);
    indexes = db.getSiblingDB(dbName).getCollection(collection).getIndexes();
    var redundant = dbkInx.existingRedundantIndexes(indexes);
    if (redundant.length > 0) {
      redundant.forEach(function(r) {
        var redundantIndex = {
          dbName: dbName,
          collection: collection,
          indexName: r.indexName,
          key: r.key,
          becauseIndex: r.becauseIndex,
          becauseKeys: r.becauseKeys
        };
        indexList.push(redundantIndex);
      });
    }
  });
  return indexList;
};

dbkInx.firstElements = function(object, N) {
  // First Elements in array
  var output = {};
  var n = 0;
  Object.keys(object).forEach(function(key) {
    if (n++ < N) {
      output[key] = object[key];
    }
  });
  return output;
};
//
// This function is a combination of suggestIndexes and proposedRedundantIndexes
//
dbkInx.suggestIndexesAndRedundants = function(explainPlan) {
    // Check for existing indexes

  // See if we can find existing indexes
  var existIndexes = dbkInx.existingIndexes(explainPlan);

  var newIndexes = dbkInx.suggestIndexKeys(explainPlan);
  var redundantIndexes = dbkInx.proposedRedundantIndexes(existIndexes, newIndexes);
  return ({
      newIndexes:newIndexes,
      redundantIndexes:redundantIndexes
  });
};
