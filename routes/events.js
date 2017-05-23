var express = require('express');
var mongoose = require('mongoose');  
var https = require('https');
var router = express.Router();
var async = require('async');


/* GET events listing. */
router.get('/', function(req, res, next) {
    
    mongoose.model('Events').find({}).sort('event').find( function (err, events) {
          if (err) {
              return console.error(err);
          } else {
              //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
              res.format({
                  //HTML response will render the index.jade file in the views/blobs folder. We are also setting "blobs" to be an accessible variable in our jade view
                html: function(){
                    res.render('events', {
                          title: 'Eventos',
                          events: events
                      });
                },
                //JSON response will show all blobs in JSON format
                json: function(){
                    res.json(events);
                }
            });
          }     
    });
    //res.send('respond with a resource');
})

/* GET events listing.  type json*/
router.get('/json', function(req, res, next) {
    
    mongoose.model('Events').find({}).sort('event').find( function (err, events) {
          if (err) {
              return console.error(err);
          } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ result: events}));
          }     
    });
    //res.send('respond with a resource');
})

//Create new events
.get("/setEvents",function(req, res) {
    
    var urlJson = 'https://events-fb-julian10404.c9users.io/javascripts/dataEvents.json';

    https.get(urlJson, function(res){
        var body = '';
        res.on('data', function(chunk){
            body += chunk;
        })
        .on('end', function(){
            var eventsResponse = JSON.parse(body);
            //console.log(eventsResponse);
            async.each(eventsResponse.data, function(eventData, callback) {
                mongoose.model('Events').find({event:eventData.event} , function (err, eventsStatus) {
                    if (err) {
                        console.error(err)
                        callback(err);
                        return callback(err);
                    } else {
                        // does not exist
                        if (eventsStatus.length <= 0) {
                            // Create new event
                            mongoose.model('Events').create({
                                event : eventData.event,
                                start_date : parseInt(eventData.start_date),
                                end_date : parseInt(eventData.end_date)
                            }, function (err, eventCreated) {
                                if (err) {
                                    console.log("There was a problem adding the information to the database.");
                                    callback(err)
                                } else {
                                    //Blob has been created
                                    console.log('Creating new event: ' + eventCreated);
                                    callback();
                                }
                            });
                        }else{
                            callback();
                        }
                    }     
                });
    
            });

        });
    }).on('error', function(e){
          console.log("Got an error: ", e);
    });
})

// Create new posts
.get("/setPost",function(req, res) {
    function toTimestamp(strDate){
       return Date.parse(strDate)/1000;
    }
    var urlJson = 'https://events-fb-julian10404.c9users.io/javascripts/dataPosts.json';

    https.get(urlJson, function(res){
        var body = '';
        res.on('data', function(chunk){
            body += chunk;
        })
        .on('end', function(){
            var postsResponse = JSON.parse(body);
            //console.log(postsResponse);
            async.each(postsResponse.data, function(postData, callback) {
                var postCreateTime = toTimestamp(postData.created_time);
                mongoose.model('Events').find({posts: { $not:{$elemMatch: {id: postData.id}}}, start_date:{$lte:postCreateTime},end_date:{$gte:postCreateTime}} , function (err, postsStatus) {
                    if (err) {
                        console.error(err)
                        callback(err);
                        return callback(err);
                    } else {
                        // If the post is within the date of the event
                        if (postsStatus.length > 0) {
                            console.log(postsStatus);
                            // Create new post
                            mongoose.model('Events').update({ _id: postsStatus[0]._id }, { $push: 
                            { 
                                posts: {
                                    id: postData.id,
                                    message: postData.message,
                                    comments: postData.comments.summary.total_count
                                } 
                            }}, function (err, eventCreated) {
                                if (err) {
                                    console.log("There was a problem adding the information to the database.");
                                    callback(err)
                                } else {
                                    //Blob has been created
                                    console.log('Creating new event: ' + eventCreated);
                                    callback();
                                }
                            });
                            callback();
                        }else{
                            callback();
                        }
                        
                    }     
                });
    
            });

        });
    }).on('error', function(e){
          console.log("Got an error: ", e);
    });
});

module.exports = router;
