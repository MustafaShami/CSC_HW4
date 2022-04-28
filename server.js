/*
Mustafa Shami
CSC3916 HW4
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');

var app = express();
app.use(cors());
app.use(bodyParser.json()); //makes it for we don't have to do json.parse everytime
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

//I Don't think I need for this assignment because we want data from request body
function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});

/** TODO
 * Make movies routes go through database using the movie schema
 */
router.route('/movies')
    //Enter Movie Information
    .post(authJwtController.isAuthenticated, function (req, res) {
        if(!req.body.title || !req.body.year || !req.body.genre || !req.body.actors
                                                    || req.body.actors.length < 3)// Check to make sure all necessary information was included
        {
            res.status(400).json({success: false, message: 'Not enough information to save a movie. Include title, year released' +
                                                                          ' genre, and 3 actors'});
        }
        else
        {
            var newMovie = new Movie(); //create new movie object and then assign it value from the request body
            newMovie.title = req.body.title;
            newMovie.year = req.body.year;
            newMovie.genre = req.body.genre;
            newMovie.actors = req.body.actors;
            newMovie.imageUrl = req.body.imageUrl;

            //save the new movie and check to make sure it was saved sucessfully
            newMovie.save(function(err)
            {
                if(err)
                {
                    if (err.code == 11000)
                    {return res.json({ success: false, message: 'A Movie with that title already stored.'});}
                    else
                    {return res.json(err);}
                }
                else
                {
                    return res.status(200).json({success:true , message:'Movie Saved!'});
                }
            })
        }
        }
    )

    //Get All Movies in the database
    .get(authJwtController.isAuthenticated, function (req, res) {
        Movie.find().exec(function (err, movies) //get movies from database
        {
            if(err) //check if error while getting movies from database
            {
                return res.json({success:false, message:'There are no movies'}, err);
            }
            if(movies.length == 0) //check if there are any movies in the database
            {
                res.status(204).json({success:false , message:'There are no movies in the database.'});
            }
            else if(movies.length >= 1)
            {
                if(req.query.reviews === "true")//check if user wants the reviews with the movie list
                {
                    Movie.aggregate([ //pipeline for aggregating reviews with movie object
                        {
                            $lookup:
                                {
                                    from: "reviews", //mongoDB collection
                                    localField: "title", //movie schema
                                    foreignField: "movieTitle", //reviews schema (title is what movie and reviews have in common and it how we combine appropriate review to each movie
                                    as: "reviews" //the name of the new aggregated field we are making
                                }
                        },
                        {
                            $addFields: //new data that will be included in the response (average review of the movie)
                            {
                                avgRating:
                                    {$avg: "$rating"}//{$avg: "$reviews.rating"}
                            }
                        }
                    ])
                    .sort({avgRating: -1}) //sort -1 (descending order)
                    .exec(function(err, reviews) //have to execute the aggregation
                        {
                            if(err)
                            {
                                return res.json(err);
                            }
                            else
                            {
                                return res.json(reviews); //return res.status(200).json({success:true , message: "Here's the Movies AND their reviews." , movieReview});
                            }
                        })
                }
                else
                {
                    //return the list of movies
                    res.status(200).json({success:true , message:'Here is all the movies in the database.' , movies});
                }
            }
        })
    });


router.route('/movies/*') //routes that require parameter of movie title
    // Delete a Movie based on title
    .delete(authJwtController.isAuthenticated, function (req, res) {
        console.log(req.body);
        res = res.status(200);
        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type')); //initialize res variable to hold the correct type we want it to
        }

        Movie.find({title: req.params['0']}).exec(function (err, movie) { //find movie with the specific title given in the request parameter
            if(err)
            {
                return res.json(err);
            }
            if(movie.length == 0)
            {
                res.status(204).json({success:false , message:'There is no movie with that title in the database.'});
            }
            else
            {
                Movie.remove({title:req.params['0']}).exec(function (err) { //delete movie with specific title , now that we know it exist in the database
                    if(err) //check if error when deleting from database
                    {
                        return res.json(err);
                    }
                    else
                    {   //tell client the title of the movie that was deleted
                        var deletedMovie = getJSONObjectForMovieRequirement(req, ' Movie has been deleted from the database.');
                        res.status(200).json({success:true , message:'Movie Successfully Deleted' , deletedMovie});
                    }
                })
            }

        })

    })

    // Get specific movie by passing title as parameter
    .get(authJwtController.isAuthenticated, function (req, res) {
        Movie.find({title:req.params['0']}).exec(function (err, movie) //get movies from database
        {
            if(err) //check if error while getting movie from database
            {
                return res.json(err);
            }
            if(movie.length == 0) //check if there is movie in database
            {
                res.status(204).json({success:false , message:'There is no movie with that title in the database.'});
            }
            else if(movie.length >= 1)
            {
                if(req.query.reviews === "true")//check if user wants the reviews with the movie list
                {
                    Movie.aggregate([ //pipeline for aggregating reviews with movie object
                        {
                            //want reviews specific to the title parameter in the request
                            $match: {title: req.params['0']}
                        },
                        {
                            $lookup:
                                {
                                    from: "reviews", //mongoDB collection
                                    localField: "title", //movie schema
                                    foreignField: "movieTitle", //reviews schema (title is what movie and reviews have in common and it how we combine appropriate review to each movie
                                    as: "reviews" //the name of the new aggregated field we are making
                                }
                        },
                        {
                            $addFields: //new data that will be included in the response (average review of the movie)
                                {
                                    avgRating:
                                        {$avg: "$rating"}//{$avg: "$reviews.rating"}
                                }
                        }
                    ])
                        //.sort({avgRating: -1}) //sort -1 (descending order)
                        .exec(function(err, movie) //have to execute the aggregation
                        {
                            if(err)
                            {
                                return res.json(err);
                            }
                            else
                            {
                                res.json(movie); //return res.status(200).json(movieReview);
                            }
                        })
                }
                else
                {
                    //return the info of movies
                    res.status(200).json({success:true , message:'Here is information about this movie.' , movie});
                }
            }
        })
    })

    // //Update Movie
    .put(authJwtController.isAuthenticated, function(req, res) {
        Movie.findOneAndUpdate({title: req.params['0']}, req.body, {new: true}, //new:true makes it so you return the UPDATED data instead of the before data
            function (err) {
                if(err)
                {
                    res.status(400).json({success:false, message:'Failed to Update this movie.'});
                }
                else
                {
                    res.status(200).json({success:true , message:'Movie Updated!'});
                }
        });
    });


router.route("/reviews")
    //Post new review and store in database
    .post(authJwtController.isAuthenticated, function(req , res) {
        if(!req.body.user || !req.body.movieTitle || !req.body.rating || !req.body.review)
        {
            return res.status(400).json({success: false, message: 'Not enough info. Remember to include username, movie title, rating, and movie review.'});
        }

        var newReview = new Review(); //creating new review object
        newReview.user = req.body.user;
        newReview.movieTitle = req.body.movieTitle;
        newReview.rating = req.body.rating;
        newReview.review = req.body.review;

        Movie.findOne({title: req.body.movieTitle}, function(err, movie)
        {
            if(err)
            {
                return res.json(err);
            }
            if(!movie) //check if the movie the user entered a review for even exists
            {
                return res.status(400).json({success:false, message: "Movie is not in the database."});
            }
            else
            {
                newReview.save(function(err)
                {
                    if(err)
                    {
                        if(err.code == 11000) //check if duplicate review
                        {
                            return res.json({success:false, message: 'Failed to save review. (duplicate review).'});
                        }
                        else
                        {
                            return res.json(err);
                        }
                    }
                    else
                    {
                        return res.status(200).json({success: true, message:'Saved Review!'});
                    }
                });
            }
        });
    })

    //get all the reviews from the database
    .get(authJwtController.isAuthenticated, function(req, res)
    {
        Review.find().exec(function(err, reviews) //did not specify constraint for find function so it will return everything in the reviews collection
        {
            if(err)
            {
                return res.json(err);
            }
            if(reviews.length == 0)
            {
                return res.status(204).json({success:false, message:'No reviews in stored.'});
            }
            else if(reviews.length >= 1)
            {
                res.status(200).json({success:true , message:'Here is all the reviews that are stored.' , reviews});
            }
        });
    });

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


