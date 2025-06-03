const express = require('express');
const router = express.Router();
const dbo = require('../db/conn');
const ObjectId = require('mongodb').ObjectId;
const MAX_RESULTS = parseInt(process.env.MAX_RESULTS);
const COLLECTION = 'books';

//getBooks()
router.get('/', async (req, res) => {
  let limit = MAX_RESULTS;
  if (req.query.limit){
    limit = Math.min(parseInt(req.query.limit), MAX_RESULTS);
  }
  let next = req.query.next;
  let query = {}
  if (next){
    query = {_id: {$lt: new ObjectId(next)}}
  }
  const dbConnect = dbo.getDb();
  let results = await dbConnect
    .collection(COLLECTION)
    .find(query, {projection: {title:1 , author:1}})
    .sort({_id: -1})
    .limit(limit)
    .toArray()
    .catch(err => res.status(400).send('Error searching for books'));
  next = results.length == limit ? results[results.length - 1]._id : null;
 
  const BASE_URL = 'http://localhost:3000/api/v2/book';
  results = results.map(book => ({
    _id: book._id,
    title: book.title,
    author: book.author,
    link: `${BASE_URL}/${book._id}`
  }));
  res.status(200).json({ results, next });


});

//getBookById()
router.get('/:id', async (req, res) => {
  const dbConnect = dbo.getDb();
  let query = {_id: new ObjectId(req.params.id)};
  let result = await dbConnect
    .collection(COLLECTION)
    .findOne(query);
  if (!result){
    res.send("Not found").status(404);
  } else {
    res.status(200).send(result);
  }
});

//addBook()
router.post('/', async (req, res) => {
  const dbConnect = dbo.getDb();
  console.log(req.body);
  let result = await dbConnect
    .collection(COLLECTION)
    .insertOne(req.body);
  res.status(201).send(result);
});

//deleteBookById() 
router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send('Invalid book ID');
  }

  const query = { _id: new ObjectId(id) };
  const dbConnect = dbo.getDb();
  const result = await dbConnect
    .collection(COLLECTION)
    .deleteOne(query)
    .catch(err => {
      console.error(err);
      return res.status(500).send('Internal server error');
    });

  if (result.deletedCount === 0) {
    return res.status(400).send('Invalid book ID');
  }

  return res.status(200).send('Book deleted');
});

module.exports = router;
