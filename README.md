# easy-dynamodb

As its name implies, easy-dynamodb is a package meant to make working with DynamoDB easier and more productive - less time spent reading heavy API documentation, less lines of code, and less mistakes.

Everything the [AWS DynamoDB SDK](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html) can do, easy-dynamodb can do -- only (hopefully) more easily.
For information on parameters that must be passed into the functions and constructor, please refer to the AWS API docs.

# Table of Contents
1. [Getting Started](#GettingStarted)
2. [Promises And Callbacks](#PromisesAndCallbacks)
3. [Simplified Key Objects](#SimplifiedKeyObjects)
4. [Useful Constants](#UsefulConstants)
  1. [Attribute Types](#EasyDynamoDB.AttributeTypes)
  2. [Key Types](#EasyDynamoDB.KeyTypes)
  3. [Return Values](#EasyDynamoDB.ReturnValues)
  4. [WaitFor States](#EasyDynamoDB.WaitForStates)
5. [The Future](#TheFuture)
6. [Integration Tests](#IntegrationTests)
7. [Changelog](#Changelog)

### <a id="GettingStarted"></a> Getting Started
In order to use easy-dynamodb, you first need to add it as a dependency of your Node project
```sh
npm install --save easy-dynamodb
```

You are now ready to write some code!
```javascript
var EasyDynamoDB = require('easy-dynamodb');

var easyDynamoDb = new EasyDynamoDB(/* Configuration */);
easyDynamoDb.createTable(/* Parameters */);
```

### <a id="PromisesAndCallbacks"></a> Promises _and_ Callbacks
With easy-dynamodb, you can freely use promises or callbacks wherever makes the most sense to you. Every function supports both with no added effort on your part. Simply provide a callback if you would like to use one, otherwise the function will return a promise you can use to run your next instruction.

If you like promises:
```javascript
easyDynamoDb.createTable(/* Parameters */)
.then(function (data) {
	console.log('We got data: ' + data);
})
.fail(function (err) {
	console.log('Uh oh: ' + err);
});
```

If you like callbacks:
```javascript
easyDynamoDb.createTable(/* Parameters */, function (err, data) {
	if (err) {
		console.log('Uh oh: ' + err);
	} else {
		console.log('We got data: ' + data);
	}
});
```
### <a id="SimplifiedKeyObjects"></a>Simplified Key Objects
When running operations on items in your database (e.g. `PutItem`, `GetItem`, etc.), the AWS SDK expects _AttributeValues_ to describe your keys:
```javascript
{
	Item: {
		/* String hash key */
		'HashKeyName' : {
			S: 'HashKeyValue'
		},
		
		/* Numerical range key */
		'RangeKeyName' : {
			N: '5'
		}
	}
	/* ... */
}
```
This can lead to cumbersome and error-prone parameter objects. With easy-dynamodb, you just use regular objects for your keys:

```javascript
{
	Item: {
		/* String hash key */
		'HashKeyName' : 'HashKeyValue'
		
		/* Numerical range key */
		'RangeKeyName' : 5
	}
	/* ... */
}
```
Similarly, the response back from DynamoDB will be automatically un-marshalled back to a regular Javascript object. 

**Note:** This feature is currently only implemented for the main ("Item"/"Key") section of `PutItem`, `GetItem`, `DeleteItem` and `UpdateItem`.

### <a id="UsefulConstants"></a>Useful Constants
Easy-dynamodb provides constants for many of the strings AWS SDK expects to help you maintain cleaner code and better programming habits.

##### <a id="EasyDynamoDB.AttributeTypes"></a> EasyDynamoDB.AttributeTypes
 - STRING
 - NUMBER
 - BINARY

```javascript
easyDynamoDb.createTable(
{
	AttributeDefinitions:
	[
		{
			AttributeName: 'myHashKey',
			AttributeType: EasyDynamoDB.AttributeTypes.STRING
		},
		{
			AttributeName: 'myRangeKey',
			AttributeType: EasyDynamoDB.AttributeTypes.NUMBER
		}
	]
	// Other parameters...
}
```

##### <a id="EasyDynamoDB.KeyTypes"></a> EasyDynamoDB.KeyTypes
 - HASH
 - RANGE
 
 ```javascript
 easyDynamoDb.createTable(
 {
	 KeySchema: 
	 [
	     {
	          AttributeName: 'myHashKey',
	          KeyType: EasyDynamoDB.KeyTypes.HASH
	      },
	      {
	          AttributeName: 'myRangeKey',
	          KeyType: EasyDynamoDB.KeyTypes.RANGE
	      }
      ]
      // Other parameters...
}
 ```
 
##### <a id="EasyDynamoDB.ReturnValues"></a> EasyDynamoDB.ReturnValues
 - NONE
 - ALL_OLD
 - UPDATED_OLD
 - ALL_NEW
 - UPDATED_NEW

```javascript
easyDynamoDb.getItem(
{
	ReturnValues: EasyDynamoDB.ReturnValues.ALL_OLD
	// Other parameters...
});
```

##### <a id="EasyDynamoDB.WaitForStates"></a>  EasyDynamoDB.WaitForStates
 - TABLE_EXISTS
 - TABLE_NOT_EXISTS

```javascript
easyDynamoDb.waitFor(
	EasyDynamoDB.WaitForStates.TABLE_EXISTS,
	{
		TableName: 'myTable
	}
);
```

### <a id="TheFuture"></a>  The Future
It is still in its early phases, but here is at least part of my wish-list for easy-dynamodb.

* Allow the user to use promises or callbacks seamlessly, depending on their situation [Done!]
* Remove the need to specify AttributeValues or to marshal/unmarshal data being passed to and from DynamoDB
* Transparently treat cases where multiple calls must be made to DynamoDB, such as with `deleteGetItem`'s max item count of 1000.
* Replace "batch" functions and make the regular function smart enough to act appropriately
* Provide constants for all AWS SDK strings

### <a id="IntegrationTests"></a> Integration Tests
If for some reason you would like to run the easy-dynamodb integration tests, check out the project and run npm install to get all the required dependencies. Then, create a file called `automation.config` under the `test` folder containing the configuration parameters you would normally pass to the EasyDynamoDB object. A basic example would be:

```json
{
  "accessKeyId": "abc123",
  "secretAccessKey": "abc1234567890",
  "region": "us-west-2"
}
```

Then simply,
```sh
cd test
mocha
```

## <a id="Changelog"></a> Changelog
### 0.0.3 - Not Released Yet
Features:
 - PutItem, GetItem, UpdateItem and DeleteItem no longer return AttributeValues as part of their main response element ("Attributes"/"Item"). They now get un-marshalled back to a regular JS object.
 - Adding constants for WaitForStates, AttributeTypes, KeyTypes and ReturnValues

Misc:
 - PutItem, GetItem, UpdateItem and DeleteItem now throw Errors if you call them without the bare minimum Key or Item object as part of your params

### 0.0.2 - July 25, 2015
Features:

 - PutItem, GetItem, UpdateItem and DeleteItem no longer require AttributeValues to be specified for their keys parameters. They now get marshalled to the correct format automatically.

Bug fixes:

 - Rename `listTable` to `listTables` and call correct underlying function
 - `waitFor` now calls correct underlying function
 - Fix context binding when calling underlying SDK to prevent "undefined is not a function" errors

### 0.0.1 - July 24, 2015
Initial release. 

Features:

 - All DynamoDB functionality from the AWS SDK can be used with callbacks or with promises.