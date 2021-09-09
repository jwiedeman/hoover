const express = require('express');
const bodyParser = require('body-parser');
const cheerio = require('cheerio');
const app = express();
const url = require('url');
const request = require('request')
var Crawler = require("crawler");
const MongoClient = require('mongodb').MongoClient;
const dbUrl =
  'mongodb://localhost:27017/myapp';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
let data = []
var c = new Crawler({
  maxConnections : 10,
  jQuery: 'cheerio',
  // This will be called for each crawled page
  callback : function (error, res, done) {
      if(error){
          console.log(error);
      }else{
        var $ = res.$;
        try{
          $("[href*='http']").each(function (i, e) { 
            console.log('E-href',$(e).attr('href'))
            request.post({url:'http://localhost:80/entity', form:{domain:'http://' + url.parse($(e).attr('href')).hostname }, function(err,httpResponse,body){ }}).on('error', function(err) {
              console.error(err)
            })
          })} 
          catch (e) {null}
      }
      done();
      console.log('Letting mongo breathe')
      setTimeout(function(){ 
        
        processNext()
       }, 5000);

  }
});


function processNext(){
  MongoClient.connect(dbUrl, { useUnifiedTopology: true }, (err, client) => {
    if (err) return console.error(err);
    const db = client.db('node-demo');
    const collection = db.collection('entity');
    collection
      .findOne({crawled : false})
      .then((results) => {
        console.log('NEXT TARGET >> ',results.domain)
        c.queue(results.domain);
        collection
          .findOneAndUpdate(
            { _id: results._id },
            {
              $set: {
                crawled : true
              },
            },
            {
              upsert: true,
            }
          ).then(() => {
        res.json('Success');
      })
          .catch(() => {
            
          });

      }).then(() => {
        res.json('Success');
      })
      .catch((error) => {
       
      });
  });
}
  

processNext()