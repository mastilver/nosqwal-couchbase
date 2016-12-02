'use strict';

const couchbase = require('couchbase');
const cuid = require('cuid');

module.exports = function (options) {
    const cluster = new couchbase.Cluster(options.connectionString || 'couchbase://localhost?detailed_errcodes=1');
    const bucket = cluster.openBucket(options.bucketName || 'default');

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
                            $type: collectionName
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
                            $type: collectionName
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
                }
            };
        }
    };
};
