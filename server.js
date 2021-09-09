const express = require('express');
const bodyParser = require('body-parser');
const port = 8000;
const axios = require('axios');
const cheerio = require('cheerio');

const MongoClient = require('mongodb').MongoClient;
const dbUrl =
  'mongodb://localhost:27017/myapp';

const app = express();

/* --------------------------------
 *    APP CONFIG
 * -------------------------------- */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static('public'));

/* --------------------------------
 *    ROUTES
 * -------------------------------- */
app.get('/', (req, res) => {
  MongoClient.connect(dbUrl, { useUnifiedTopology: true }, (err, client) => {
    if (err) return console.error(err);
    const db = client.db('node-demo');
    const collection = db.collection('entity');
    collection
      .find()
      .toArray()
      .then((results) => {
        res.render('index.ejs', { entity: results });
      })
      .catch((error) => {
        res.redirect('/');
      });
  });
});

app.post('/entity', async (req, res) => {
  MongoClient.connect(dbUrl, { useUnifiedTopology: true },   async (err, client) => {
    if (err) return console.error(err);
    const db = client.db('node-demo');
    const collection = db.collection('entity');
    
    const cursor =  await collection.countDocuments({ domain : req.body.domain });
    if(cursor < 1){ 
    console.log('POST : Adding ' + req.body.domain)
     collection
      .update({domain : req.body.domain , crawled : false}, {domain : req.body.domain , crawled : false} ,  {upsert:true})
      .then(() => {
        res.redirect('/');
      })
      .catch(() => {
        res.redirect('/');
      });
    } else {
      console.log('Duplicate Entry detected, Abandoning Request' , req.body)
    }
  });
});

app.delete('/entity', (req, res) => {
  
  MongoClient.connect(dbUrl, { useUnifiedTopology: true }, (err, client) => {
    if (err) return console.error(err);
    const db = client.db('node-demo');
    console.log('Delete', req.body)
    const collection = db.collection('entity');
    collection
      .deleteMany({domain : req.body.domain})
      .then(() => {
        res.json(`Deleted user`);
      })
      .catch(() => {
        res.redirect('/');
      });
  });
});

app.put('/entity', (req, res) => {
  MongoClient.connect(dbUrl, { useUnifiedTopology: true }, (err, client) => {
    if (err) return console.error(err);
    const db = client.db('node-demo');
    const collection = db.collection('entity');
    collection
      .findOneAndUpdate(
        { domain: req.body.olddomain, cms: req.body.oldcms },
        {
          $set: {
            domain: req.body.domain,
            cms: req.body.cms,
          },
        },
        {
          upsert: true,
        }
      )
      .then(() => {
        res.json('Success');
      })
      .catch(() => {
        res.redirect('/');
      });
  });
});

/* --------------------------------
 *    START SERVER
 * -------------------------------- */


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  
});








