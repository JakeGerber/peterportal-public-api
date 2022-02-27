/**
 @module MongoHelper
*/

var { MongoClient, Db, Collection } = require('mongodb')

/**
 * Client used to connect to mongo
 */
const client = new MongoClient(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
/**
 * Database name to use in mongo
 */
const DB_NAME = 'peterPortalDB';
/**
 * Collection names that we are using
 */
const COLLECTION_NAMES = {
    SESSIONS: 'sessions',
    REVIEWS: 'reviews',
    SCHEDULE: 'schedule',
    ROADMAPS: 'roadmaps',
    VOTES: 'votes',
    REPORTS: 'reports'
}
/**
 * Global reference to database
 */
let db = undefined;

/**
 * Get a mongo database object
 * @returns Mongo database object
 */
function getDB() {
    return new Promise((resolve, reject) => {
        // if not connected yet, initiate connection
        if (!db) {
            client.connect(async err => {
                if (err) {
                    reject(err);
                }
                else {
                    db = client.db(DB_NAME);

                    // get existing mongo collection
                    let collectionNames = Object.values(COLLECTION_NAMES);
                    let collections = await db.listCollections().toArray();
                    let existingCollectionNames = [];
                    collections.forEach(collection => {
                        existingCollectionNames.push(collection['name']);
                    })

                    // create collections that dont exist
                    for (let i = 0; i < collectionNames.length; ++i) {
                        let collectionName = collectionNames[i];
                        if (!existingCollectionNames.includes(collectionName)) {
                            await db.createCollection(collectionName);
                        }
                    }
                    resolve(db);
                }
            });
        }
        else {
            resolve(db);
        }
    })
}

/**
 * Gets mongo collection object by name
 * @param collectionName Name of collection to retreive
 * @returns Mongo collection object
 */
function getCollection(collectionName) {
    return new Promise(async (resolve, reject) => {
        await getDB();
        // check if collection exists
        db.listCollections({ name: collectionName })
            .next(function (err, collection) {
                if (err) reject(err);
                if (collection) {
                    resolve(db.collection(collectionName));
                }
                else {
                    reject(`Collection ${collectionName} does not exist!`);
                }
            });
    });
}

/**
 * Checks if id exists in result collection
 * @param collectionName Name of collection
 * @param id ID of the document
 * @returns True if document ID exists in the given collection 
 */
function containsID(collectionName, id) {
    return new Promise(async (resolve, reject) => {
        await getDB();
        getCollection(collectionName)
            .then(async (collection) => {
                resolve(await collection.find({
                    '_id': id
                }).count() > 0);
            })
            .catch(err => reject(err));
    });
}

/**
 * Adds a document to a collection
 * @param collectionName Name of collection
 * @param document Document object to add
 * @returns Promise that is resolved when document is added
 */
function addDocument(collectionName, document) {
    return new Promise(async (resolve, reject) => {
        await getDB();
        // get collection
        getCollection(collectionName)
            .then(async (collection) => {
                // Add the document
                collection.insertOne(document, (error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            });
    });
}

/**
 * Gets a document from a collection
 * @param collectionName Name of collection
 * @param query Query object
 * @returns Mongo Document objects returned from the query
 */
function getDocuments(collectionName, query) {
    return new Promise(async (resolve, reject) => {
        await getDB();
        // get collection
        getCollection(collectionName)
            .then(async (collection) => {
                // get document
                let results = collection.find(query);
                let documents = await results.toArray();
                resolve(documents);
            });
    })
}

/**
 * Updates a document from a collection
 * @param collectionName Name of collection
 * @param query Query object
 * @param update Update object
 * @returns 
 */
function updateDocument(collectionName, query, update) {
    return new Promise(async (resolve, reject) => {
        await getDB();
        getCollection(collectionName)
            .then(async (collection) => {
                collection.updateOne(query, update, (err) => {
                    if (err) console.log(err)
                });
                resolve();
            })
    });
}

/**
 * Replaces a document from a collection
 * @param collectionName Name of collection
 * @param query Query object
 * @param update Update object
 * @returns 
 */
 function replaceDocument(collectionName, query, update) {
    return new Promise(async (resolve, reject) => {
        await getDB();
        getCollection(collectionName)
            .then(async (collection) => {
                collection.replaceOne(query, update, (err) => {
                    if (err) console.log(err)
                });
                resolve();
            })
    });
}

/**
 * Deletes a document from a collection
 * @param collectionName Name of collection
 * @param query Query object
 * @returns 
 */
function deleteDocument(collectionName, query) {
    return new Promise(async (resolve, reject) => {
        await getDB();
        getCollection(collectionName)
            .then(async (collection) => {
                await collection.deleteOne(query, (err) => {
                    if (err) console.log(err);
                });
                resolve();
            })
    })
}

/**
 * Retrieve mongo's cached value by key
 * @param cache Name of cache to look up
 * @param key Key to look up the cache
 * @returns Cached value
 */
async function getValue(cache, key) {
    return new Promise(async resolve => {
        let value = await getDocuments(cache, { _id: key });
        // cache hit
        if (value.length > 0) {
            resolve(value[0]['value']);
        }
        // cache miss
        else {
            resolve(undefined);
        }
    })
}

/**
 * Put a cache value given a key
 * @param cache Name of cache to look up
 * @param key Key to use in cache
 * @param value Value to store in cache
 * @returns Promise that is resolved when value is cached
 */
async function setValue(cache, key, value) {
    return new Promise(async resolve => {
        // if already in cache, update doc
        if (await containsID(cache, key)) {
            await replaceDocument(cache, { _id: key }, { value: value })
        }
        // if not in cache, add doc
        else {
            await addDocument(cache, { _id: key, value: value })
        }
        resolve();
    })
}

module.exports = { DB_NAME, COLLECTION_NAMES, getCollection, getDB, containsID, addDocument, getDocuments, updateDocument, replaceDocument, deleteDocument, setValue, getValue };