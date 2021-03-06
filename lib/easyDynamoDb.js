var AWS = require('aws-sdk');
var Q = require('q');
var marshaler = require('dynamodb-marshaler');
var _ = require('lodash');

function EasyDynamoDB(options) {
    this._dynamodb = new AWS.DynamoDB(options);
}

/**
 * Run the given function.
 * If a callback is provided, run it. Otherwise return a promise.
 * @param func
 * @param callback
 * @returns {*|promise}
 */
function run(func, callback) {
    if (_.isFunction(callback)) {
        func(callback);
    } else {
        var deferred = Q.defer();

        func(function (err, data) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(data);
            }
        });

        return deferred.promise;
    }
}

/**
 * Make a callback-based function return a promise instead.
 * @param func
 * @returns {*|promise}
 */
function promisify(func) {
    var deferred = Q.defer();

    func(function (err, data) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(data);
        }
    });

    return deferred.promise;
}

/**
 * Fails with the given error.
 * If a callback is provided, run it. Otherwise return a rejected promise.
 * @param e
 * @param callback
 * @returns {*}
 */
function fail(e, callback) {
    if(_.isFunction(callback)) {
        callback(e);
    } else {
        return Q.reject(e);
    }
}

function toDynamoDbFormat(toMarshal) {
    return marshaler.marshalItem(toMarshal);
}

function fromDynamoDbFormat(toUnmarshal) {
    return marshaler.unmarshalItem(toUnmarshal);
}

/** Table Operations **/
EasyDynamoDB.prototype.createTable = function(params, callback) {
    return run(this._dynamodb.createTable.bind(this._dynamodb, params), callback);
};

EasyDynamoDB.prototype.deleteTable = function(tableName, callback) {

    var params = {
        TableName: tableName
    };

    return run(this._dynamodb.deleteTable.bind(this._dynamodb, params), callback);
};

EasyDynamoDB.prototype.describeTable = function(tableName, callback) {

    var params = {
        TableName: tableName
    };

    return run(this._dynamodb.describeTable.bind(this._dynamodb, params), callback);
};

function _listTables(dynamodb, allTables, lastTableName, deferred) {
    if (_.isUndefined(deferred)) {
        deferred = Q.defer();
    }

    if (_.isUndefined(allTables) || !_.isArray(allTables)) {
        allTables = [];
    }

    var params = {};
    if (!_.isUndefined(lastTableName)) {
        params.ExclusiveStartTableName = lastTableName;
    }

    dynamodb.listTables(params, function (err, data) {
        if (err) {
            deferred.reject(err);
        } else {
            // Add new tables to running total
            allTables = data.TableNames.concat(allTables);

            // Run again?
            if (!_.isUndefined(data.LastEvaluatedTableName)) {
                _listTables(dynamodb, allTables, data.LastEvaluatedTableName, deferred);
            } else {
                deferred.resolve(allTables);
            }
        }
    });

    return deferred.promise;
}

EasyDynamoDB.prototype.listTables = function(callback) {
    var listTablesPromise = _listTables(this._dynamodb);
    if (_.isFunction(callback)) {
        listTablesPromise
            .then(function (data) {
                callback(null, data);
            })
            .fail(callback);
    } else {
        return listTablesPromise;
    }
};

EasyDynamoDB.prototype.changeProvisionedThroughput = function(tableName, readCapacity, writeCapacity, callback) {
    var params = {
        TableName: tableName,
        ProvisionedThroughput: {
            ReadCapacityUnits: readCapacity,
            WriteCapacityUnits: writeCapacity
        }
    };

    if (_.isFunction(callback)) {
        this._dynamodb.listTables({}, callback);
    } else {
        return promisify(this._dynamodb.updateTable.bind(this._dynamodb, params));
    }
};

EasyDynamoDB.prototype.deleteGlobalSecondaryIndex = function(tableName, indexName, callback) {
    var params = {
        TableName: tableName,
        GlobalSecondaryIndexUpdates: [
            {
                Delete: {
                    IndexName: indexName
                }
            }
        ]
    };

    if (_.isFunction(callback)) {
        this._dynamodb.listTables({}, callback);
    } else {
        return promisify(this._dynamodb.updateTable.bind(this._dynamodb, params));
    }
};

EasyDynamoDB.prototype.updateTable = function(params, callback) {
    return run(this._dynamodb.updateTable.bind(this._dynamodb, params), callback);
};

EasyDynamoDB.prototype.waitFor = function(tableName, state, callback) {
    var params = {
        TableName: tableName
    };

    return run(this._dynamodb.waitFor.bind(this._dynamodb, state, params), callback);
};

/** Item Operations **/
EasyDynamoDB.prototype.batchGetItem = function(params, callback) {
    return run(this._dynamodb.batchGetItem.bind(this._dynamodb, params), callback);
};

EasyDynamoDB.prototype.batchWriteItem = function(params, callback) {
    return run(this._dynamodb.batchWriteItem.bind(this._dynamodb, params), callback);
};

EasyDynamoDB.prototype.deleteItem = function(params, callback) {

    if (_.isUndefined(params.Key)) {
        return fail(new Error('Parameters must contain a "Key" object'), callback);
    }

    params.Key = toDynamoDbFormat(params.Key);

    var _convert = function(data) {
        if (data && data.Attributes) {
            data.Attributes = fromDynamoDbFormat(data.Attributes);
        }
        return data;
    };

    if (_.isFunction(callback)) {
        this._dynamodb.deleteItem(params, function (err, data) {
            callback(err, _convert(data));
        });
    } else {
        return promisify(this._dynamodb.deleteItem.bind(this._dynamodb, params))
            .then(_convert);
    }
};

EasyDynamoDB.prototype.getItem = function(params, callback) {

    if (_.isUndefined(params.Key)) {
        return fail(new Error('Parameters must contain a "Key" object'), callback);
    }
    params.Key = toDynamoDbFormat(params.Key);

    var _convert = function(data) {
        if (data && data.Item) {
            data.Item = fromDynamoDbFormat(data.Item);
        }
        return data;
    };

    if (_.isFunction(callback)) {
        this._dynamodb.getItem(params, function (err, data) {
            callback(err, _convert(data));
        });
    } else {
        return promisify(this._dynamodb.getItem.bind(this._dynamodb, params))
            .then(_convert);
    }
};

EasyDynamoDB.prototype.putItem = function(params, callback) {

    if (_.isUndefined(params.Item)) {
        return fail(new Error('Parameters must contain an "Item" object'), callback);
    }
    params.Item = toDynamoDbFormat(params.Item);

    var _convert = function(data) {
        if (data && data.Attributes) {
            data.Attributes = fromDynamoDbFormat(data.Attributes);
        }
        return data;
    };

    if (_.isFunction(callback)) {
        this._dynamodb.putItem(params, function (err, data) {
            callback(err, _convert(data));
        });
    } else {
        return promisify(this._dynamodb.putItem.bind(this._dynamodb, params))
            .then(_convert);
    }
};

EasyDynamoDB.prototype.query = function(params, callback) {
    return run(this._dynamodb.query.bind(this._dynamodb, params), callback);
};

EasyDynamoDB.prototype.scan = function(params, callback) {
    return run(this._dynamodb.scan.bind(this._dynamodb, params), callback);
};

EasyDynamoDB.prototype.updateItem = function(params, callback) {

    if (_.isUndefined(params.Key)) {
        return fail(new Error('Parameters must contain a "Key" object'), callback);
    }

    params.Key = toDynamoDbFormat(params.Key);

    var _convert = function(data) {
        if (data && data.Attributes) {
            data.Attributes = fromDynamoDbFormat(data.Attributes);
        }
        return data;
    };

    if (_.isFunction(callback)) {
        this._dynamodb.updateItem(params, function (err, data) {
            callback(err, _convert(data));
        });
    } else {
        return promisify(this._dynamodb.updateItem.bind(this._dynamodb, params))
            .then(_convert);
    }
};

module.exports = EasyDynamoDB;