const express = require('express');
const bodyParser = require('body-parser');
const cheerio = require('cheerio');
const app = express();
const url = require('url');
const request = require('request')
var Crawler = require("crawler");
const MongoClient = require('mongodb').MongoClient;
var throttledQueue = require('throttled-queue');


const dbUrl = 'mongodb://localhost:27017/localdb';

var throttle = throttledQueue(1, 100);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

process.on('unhandledRejection', function(err) {
  console.log(err);
  // sendInTheCalvary(err);
});

var db 
var collection 
MongoClient.connect(dbUrl, { connectTimeoutMS : 1000, socketTimeoutMS:1000,useUnifiedTopology: true },  (err, client) => {
  console.log('Connected to MONGODB')
  db = client.db('node-demo');
  collection = db.collection('entity');
  if (err) return null;
  processNext(db)

})


var c = new Crawler({
  retries:0,
  timeout : 1500,
  jQuery: false,
  callback :async function (error, res, done) {
    var currentTotal =await  collection.count()
      if(error){
        console.log(error);
      }else{
        try{
        var $ = cheerio.load(res.body);
        
          var links =[]
          $("[href*='http']").each( function (i, e) {
            addUnique('http://' + url.parse($(e).attr('href')).hostname, links)
          })
         
          links.forEach(async element => {
            
          
            const cursor = await collection.countDocuments({ domain : element });
            if(cursor < 1){ 
              
              console.log( currentTotal,' +  ADDING >> ' + element)
              currentTotal+=1
               collection.updateOne({domain : element , crawled : false}, {$set: {domain : element , crawled : false} },  {upsert:true}).catch(() => {
                  //res.redirect('/');
                });
              } 
          })

        } 
        catch (e) { 
          return null 
          done();
          processNext()
        }
       
      }
      done();
      processNext()
  }
});




 function processNext (){
    var currentTotal =  collection.count()
    collection
    .findOne({crawled : false})
    .then((results) => {
      console.log(currentTotal ,  ' NEXT TARGET >> ',results.domain)
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
      }).catch(() => {});

      }).then(() => {
        res.json('Success');
      })
      .catch((error) => {
          return null
      });
 // })
}
  



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
     
      
  }
}











// networked crawler
/*
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
  'mongodb://localhost:27017/localdb';

var throttle = throttledQueue(1, 200);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
let data = []
var c = new Crawler({
  retries:0,
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
  MongoClient.connect(dbUrl, { connectTimeoutMS : 500, socketTimeoutMS:500,maxTimeMS:500,useUnifiedTopology: true }, (err, client) => {
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
      }).catch(() => {});

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
*/