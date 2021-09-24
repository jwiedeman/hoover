
const cheerio = require('cheerio');
const url = require('url');
var Crawler = require("crawler");
const MongoClient = require('mongodb').MongoClient;
const extractDomain = require("extract-domain");
const dbUrl = 'mongodb://192.168.2.102:27017/localdb';
var nodefound =0
var db 
var collection 


// Launch command
// pm2 start crawler.js --name crawler --watch --restart-delay 600000
// ./node_modules/.bin/pm2 start crawler.js --name crawler --watch --restart-delay 600000


MongoClient.connect(dbUrl, { useUnifiedTopology: true },  (err, client) => {
  console.log('Connected to MONGODB')
  db = client.db('node-demo');
  collection = db.collection('node-demo');
  if (err) return null;
  processNext(db)

})
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

var _X =0
var c = new Crawler({
  retries: 0,
  jQuery: false,
  callback: async function (error, res, done) {
    if (error || res.statusCode == undefined || typeof (res.body) == undefined) {
      processNext()
      done()
    } else {
      //console.log('STATUS : ' + JSON.stringify(res.request.headers), typeof (res.body))
      var startTotal = await collection.estimatedDocumentCount()
      _X = startTotal
      var $ = cheerio.load(res.body);
      var links =[]
      
      
      
      
      $("[href*='http']").each(function (i, e) {
        links.push('http://' + url.parse($(e).attr('href')).hostname)
      })
      var linkList = [...new Set(links)]


      linkList.forEach(async (element) => {
        try{
        var parseResult = extractDomain(element);
        parseResult = 'http://' + parseResult
        const cursor = await collection.countDocuments({domain: parseResult});
        if (cursor < 1) {
          nodefound+=1
          console.log('FOUND    >> ' + (startTotal +=1).toLocaleString('en'),nodefound, parseResult)
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
      }catch(err) {
        console.log(err) // TypeError: failed to fetch
      }
      })
      done();
      processNext()
    }
  }
});



  function processNext (){
    collection
    .findOne({crawled : false})
    .then( (results) => {
        //console.log('CRAWLING >> ',_X.toLocaleString('en'),  results.domain)
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
          ).then(() => { c.queue(results.domain) })
      })
}
  







