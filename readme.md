# nosqwal-couchbase [![Build Status](https://travis-ci.org/mastilver/nosqwal-couchbase.svg?branch=master)](https://travis-ci.org/mastilver/nosqwal-couchbase) [![Coverage Status](https://coveralls.io/repos/github/mastilver/nosqwal-couchbase/badge.svg?branch=master)](https://coveralls.io/github/mastilver/nosqwal-couchbase?branch=master)

> My luminous module


## Install

```
$ npm install --save nosqwal-couchbase
```


## Usage

```js
const nosqwalCouchbase = require('nosqwal-couchbase');
const db = nosqwalCouchbase();

const userCollection = db.defineCollection('user');

userCollection.query()
.then(users => {
    console.log(users);
    // => []
});

```


## API

### nosqwalCouchbase([options])

Retuns a noSqwal instance, see api [here](https://github.com/mastilver/nosqwal#api)

#### options

##### options.connectionString

Type: `string`<br>
Default: `couchbase://localhost?detailed_errcodes=1`

Couchbase connection string

##### options.bucketName

Type: `string`<br>
Default: `default`

Couchbase bucket name


## License

MIT © [Thomas Sileghem](http://mastilver.com)
