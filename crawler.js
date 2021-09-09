const express = require('express');
const bodyParser = require('body-parser');
const cheerio = require('cheerio');
const app = express();
const url = require('url');
const request = require('request')
var Crawler = require("crawler");
const MongoClient = require('mongodb').MongoClient;
var throttledQueue = require('throttled-queue');
const dbUrl =
  'mongodb://localhost:27017/myapp';

var throttle = throttledQueue(10, 200);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
let data = []
var c = new Crawler({
  maxConnections : 1,
  jQuery: 'cheerio',
  // This will be called for each crawled page
  callback : function (error, res, done) {
      if(error){
          console.log(error);
      }else{
        var $ = res.$;
        var tempData =[]
        try{
          $("[href*='http']").each(function (i, e) {
              throttle(function() { 
                addUnique('http://' + url.parse($(e).attr('href')).hostname , tempData )
                
                
            })
          })} 
          catch (e) {null}
      }
      done();
        processNext()
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


function addUnique(data, targetArr) {
  var index = -1;
  for (var i = 0; i < targetArr.length; i++) {
      if (targetArr[i] === data) {
          index = i;
      }
  }
  if (index > -1) {
      targetArr[index] = data;
  } else {
      
      targetArr.push(data)
      console.log('POST : ' + data , targetArr.length)
      request.post({url:'http://localhost:8000/entity', form:{domain:data }, function(err,httpResponse,body){ }}).on('error', function(err) {});
      
  }
}