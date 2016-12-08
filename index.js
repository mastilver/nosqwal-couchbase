'use strict';

const couchbase = require('couchbase');
const cuid = require('cuid');
const pWaitFor = require('p-wait-for');

const N1qlQuery = couchbase.N1qlQuery;

module.exports = function (options) {
    options = options || {};

    const connectionString = options.connectionString || 'couchbase://localhost?detailed_errcodes=1';
    const bucketName = options.bucketName || 'default';

    const cluster = new couchbase.Cluster(connectionString);
    const bucket = cluster.openBucket(bucketName);

    const primaryIndexPromise = createPrimaryIndex(bucket, bucketName);

    return {
        defineCollection(collectionName) {
            return {
                get(id) {
                    return new Promise((resolve, reject) => {
                        bucket.get(`${collectionName}-${id}`, (err, result) => {
                            if (err) {
                                return reject(err);
                            }

                            resolve(result.value);
                        });
                    });
                },

                create(doc) {
                    return new Promise((resolve, reject) => {
                        const docToCreate = Object.assign({
                            id: cuid()
                        }, doc, {
                            _type: collectionName
                        });

                        bucket.insert(`${collectionName}-${docToCreate.id}`, docToCreate, err => {
                            if (err) {
                                return reject(err);
                            }

                            resolve(docToCreate);
                        });
                    });
                },

                update(doc) {
                    return new Promise((resolve, reject) => {
                        const docToUpdate = Object.assign({}, doc, {
                            _type: collectionName
                        });

                        bucket.upsert(`${collectionName}-${docToUpdate.id}`, docToUpdate, err => {
                            if (err) {
                                return reject(err);
                            }

                            resolve(docToUpdate);
                        });
                    });
                },

                delete(id) {
                    return new Promise((resolve, reject) => {
                        bucket.remove(`${collectionName}-${id}`, err => {
                            if (err) {
                                return reject(err);
                            }

                            resolve();
                        });
                    });
                },

                query(queryOptions) {
                    return Promise.resolve(primaryIndexPromise)
                        .then(() => new Promise((resolve, reject) => {
                            const q = buildQuery(bucketName, collectionName, queryOptions);

                            const n1qlQuery = N1qlQuery.fromString(q.query);
                            n1qlQuery.consistency(N1qlQuery.Consistency.REQUEST_PLUS);

                            bucket.query(n1qlQuery, q.params, (err, result) => {
                                if (err) {
                                    return reject(err);
                                }

                                resolve(result);
                            });
                        }));
                }
            };
        }
    };
};

/*
    - Check first if we can query
    - If we can't then it create the primary index
    - Then it waits untils it's ready
*/
function createPrimaryIndex(bucket, bucketName) {
    return checkBucketReadyToBeQueried(bucket, bucketName)
    .then(isReady => {
        if (!isReady) {
            return new Promise((resolve, reject) => {
                const bucketManager = bucket.manager();
                bucketManager.createPrimaryIndex(err => {
                    if (err) {
                        reject(err);
                    }

                    resolve();
                });
            })
            .then(() => pWaitFor(() => checkBucketReadyToBeQueried(bucket, bucketName)));
        }
    });
}

function checkBucketReadyToBeQueried(bucket, bucketName) {
    return new Promise(resolve => {
        const n1qlQuery = N1qlQuery.fromString(`SELECT * FROM ${bucketName}`);
        n1qlQuery.consistency(N1qlQuery.Consistency.REQUEST_PLUS);

        bucket.query(n1qlQuery, [], err => {
            if (err) {
                return resolve(false);
            }

            resolve(true);
        });
    });
}

function buildQuery(bucketName, collectionName, queryOptions) {
    queryOptions = queryOptions || {};
    const where = queryOptions.where || {};
    const limit = queryOptions.limit;
    const offset = queryOptions.offset || 0;
    const orderBy = queryOptions.orderBy || [];

    const queryParams = [];
    let queryString = `
        SELECT a.*
        FROM ${bucketName} a
        WHERE a._type = "${collectionName}"
    `;

    Object.keys(where).forEach(prop => {
        const operator = Object.keys(where[prop])[0];

        switch (operator) {
            case '$eq': {
                const paramId = addParams(where[prop].$eq);
                queryString += `
                    AND
                    a.${prop} = ${paramId}
                `;
            }
                break;
            default:

        }
    });

    orderBy.forEach(order => {
        const asc = order[1] == null || order[1] === true;

        queryString += `
            ORDER BY ${order[0]} ${asc ? 'ASC' : 'DESC'}
        `;
    });

    if (limit != null) {
        queryString += `
            LIMIT ${limit}
        `;

        if (offset !== 0) {
            queryString += `
                OFFSET ${offset}
            `;
        }
    }

    return {
        query: `${queryString};`,
        params: queryParams
    };

    function addParams(param) {
        queryParams.push(param);
        return `$${queryParams.length}`;
    }
}
