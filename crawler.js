const cheerio = require('cheerio');
const url = require('url');
var Crawler = require("crawler");
const MongoClient = require('mongodb').MongoClient;
const extractDomain = require("extract-domain");
const dbUrl = 'mongodb://192.168.2.102:27017/localdb';
var Sitemapper = require('sitemapper');
var sitemapper = new Sitemapper();
var db
var collection


// Launch command
// pm2 start crawler.js --name crawler --watch --restart-delay 600000
// ./node_modules/.bin/pm2 start crawler.js --name crawler --watch --restart-delay 600000
/*
     type, website, serer, cdn, etc. 
     cms
     sitemap?
     sitemapPages arr
     google analytics?
     google analytics ID arr
     google ads?
     Google ads id arr
     google tag manager?
     gtm id
     
     */

MongoClient.connect(dbUrl, {
  useUnifiedTopology: true
}, (err, client) => {
  console.log('Connected to MONGODB')
  db = client.db('node-demo');
  collection = db.collection('node-demo');
  if (err) return null;
  processNext(db)
})



var c = new Crawler({ // Main crawler
  retries: 0,
  rateLimit: 250,
  jQuery: false,
  callback: async function (error, res, done) {
    if (error || res.statusCode == undefined || typeof (res.body) == undefined) {
      done()
    } else {
      //console.log('CRAWLING >> ' + JSON.stringify(res.request.href))
      var startTotal = await collection.estimatedDocumentCount();
      var $ = cheerio.load(res.body);
      var links = [];
      $("[href*='http']").each(function (i, e) {
        links.push('http://' + url.parse($(e).attr('href')).hostname)
      })
      var linkList = [...new Set(links)]


      linkList.forEach(async (element) => {
        try {
          var parseResult = extractDomain(element);
          parseResult = 'http://' + parseResult
          const cursor = await collection.countDocuments({
            domain: parseResult
          });
          if (cursor < 1) {
            console.log('FOUND    >> ' + (startTotal += 1).toLocaleString('en'), parseResult)
            collection.updateOne({
              domain: parseResult
            }, {
              $set: {
                domain: parseResult,
                crawled: false
              }
            }, {
              upsert: true
            }).catch(() => {});
          }
        } catch (err) {
          console.log(err) // TypeError: failed to fetch
        }
      })
      done();

    }
  }
});



var cdeep = new Crawler({ // deep crawler, does not callback 
  retries: 0,
  maxConnections: 10,
  timeout:2000, 
  jQuery: false,
  callback: async function (error, res, done) {
    if (error || res.statusCode == undefined || typeof (res.body) == undefined) {
     // console.log(error)
      done()
    } else {
      
      var startTotal = await collection.estimatedDocumentCount();
      var $ = cheerio.load(res.body);
      var links = [];
      $("[href*='http']").each(function (i, e) {
        links.push('http://' + url.parse($(e).attr('href')).hostname)
      })
      var linkList = [...new Set(links)]
      //console.log('CRAWLING DEEP >> ' + JSON.stringify(res.request.href))
      linkList.forEach(async (element) => {
        try {
          var parseResult = extractDomain(element);
          parseResult = 'http://' + parseResult
          const cursor = await collection.countDocuments({
            domain: parseResult
          });
          if (cursor < 1) {
            console.log('DEEPFOUND>> ' + (startTotal += 1).toLocaleString('en'), '/' , parseResult , '  FOUND ON >>',JSON.stringify(res.request.href))
            collection.updateOne({
              domain: parseResult
            }, {
              $set: {
                domain: parseResult,
                crawled: false
              }
            }, {
              upsert: true
            }).catch(() => {});
          }
        } catch (err) {
          console.log(err) // TypeError: failed to fetch
        }
      })
      done();
    }
  }
});


c.on('drain',function(){
  if(c.queueSize == 0 && cdeep.queueSize ==0){ processNext() }
});
cdeep.on('drain',function(){
  if(c.queueSize == 0 && cdeep.queueSize ==0){ processNext() }
});



function processNext() {
  collection
    .findOne({
      crawled: false
    })
    .then((results) => {
      //console.log('CRAWLING >> ',  results.domain)
      collection
        .findOneAndUpdate({
          _id: results._id
        }, {
          $set: {
            crawled: true
          },
        }, {
          upsert: true,
        }).then(() => {
          sitemapper.fetch(results.domain + '/sitemap.xml').then(function(sites) { // Crawl all pages
            if(sites.sites.length > 0 && sites.sites.length < 2000){
            //console.log('Sitemap Detected, CDEEP Queueing . . .', sites.sites.length)
            cdeep.queue(sites.sites);
          }
          })
          c.queue(results.domain) // Crawl landing page
          
        })
    })
}