const User = require('./models/user');
const AllBar = require('./models/allbar');
const Bar = require('./models/bar');
var searchTerm = require('./models/searchTerm');
const mongoose = require('mongoose');
var configDB = require('../config/database.js');
const assert = require('assert');
const yelp = require('yelp-fusion');

module.exports = function(app, passport){
// render the main index page
app.get('/', function(req, res) {
  AllBar.find({})
    .exec(function(err, allbars){
    if (err){
      res.send('error has occured!');
    }else {
      res.render('pages/index', {allbars: allbars})
    }
    })
});

//Local login routes
app.get('/login', function(req, res){
  		res.render('pages/login.ejs', { message: req.flash('loginMessage') });
  	  });
app.post('/login', passport.authenticate('local-login', {
  		successRedirect: '/allBars',
  		failureRedirect: '/login',
  		failureFlash: true
  	  }));
//logout
app.get('/logout', function(req, res){
      		req.logout();
      		res.redirect('/');
      	});
// show the signup form
app.get('/signup', function(req, res) {
         res.render('pages/signup.ejs', { message: 'Get signed up!' });
     });
app.post('/signup',  passport.authenticate('local-signup', {
      successRedirect: '/allBars',
      failureRedirect: '/signup',
      failureFlash: true
    }),function(req, res){
    });
//Update get local only
app.get('/user', isLoggedIn, function(req, res){
      var user = req.user;
      res.render('pages/user.ejs', { message: 'Update location!' , user: req.user });
    });

//Update local user post
    app.post('/user', isLoggedIn, function(req, res){
      var user = req.body;
      var id = req.user._id;
      //console.log(id);
      User.findOne({_id: id}, function(err, user){
        var newUser = user;
        //console.log(user);
        user.local.username = req.body.email;
        user.local.city = req.body.city;
        user.state = req.body.state;

        user.save(function(err){
          if(err)
          throw err;
          //console.log(user);
          res.render('pages/profile.ejs', { user: req.user  });
        })
      })
    });

//profile page
app.get('/profile', /*isLoggedIn,*/ function(req, res){
		res.render('pages/profile.ejs', { user: req.user });
});

//facebook login
app.get('/auth/facebook',  passport.authenticate('facebook', { scope: [ 'email' ] }));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/allBars',
                                      failureRedirect: '/' }));

//twitter auth
app.get('/auth/twitter', passport.authenticate('twitter'));
//twitter callback
app.get('/auth/twitter/callback',
       passport.authenticate('twitter', { successRedirect : '/allBars',
                                          failureRedirect : '/' }));

//google login
app.get('/auth/google',  passport.authenticate('google', { scope: [ 'profile', 'email' ] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { successRedirect:'/allBars',
                                    failureRedirect: '/' }));

// connect all sign in pages
app.get('/connect/facebook', passport.authorize('facebook', { scope: 'email' }));

app.get('/connect/allBars', passport.authenticate('twitter'));

app.get('/connect/twitter', passport.authenticate('twitter'));

app.get('/connect/google', passport.authorize('google', { scope: ['profile', 'email'] }));

app.get('/connect/local', function(req, res){
	res.render('pages/connect-local.ejs', { message: req.flash('signupMessage')});
});

app.post('/connect/local', passport.authenticate('local-signup', {
	successRedirect: '/profile',
	failureRedirect: '/connect/local',
	failureFlash: true
}));

//unlink all pages
app.get('/unlink/facebook', function(req, res){
		var user = req.user;
		user.facebook.token = null;
		user.save(function(err){
			if(err)
				throw err;
			res.redirect('/profile');
		})
	});

app.get('/unlink/twitter', function(req, res){
		var user = req.user;
		user.twitter.token = null;
		user.save(function(err){
			if(err)
				throw err;
			res.redirect('/profile');
		})
	});

app.get('/unlink/local', function(req, res){
    var user = req.user;
    var city = req.city;
    var state = req.state;
    user.local.username = null;
    user.local.password = null;
    user.save(function(err){
	if(err)
     	   throw err;
	res.redirect('/profile');
	});
});

app.get('/unlink/google', function(req, res){
		var user = req.user;
		user.google.token = null;
		user.save(function(err){
			if(err)
				throw err;
			res.redirect('/profile');
		});
	});

//add a bar to the database
  app.post('/addBar', function(req, res){
    var result = req.body;
    console.log('below is result');
    //console.log(result);
    var allbar = [{
      yelp_rating:  result.rating,
      review_count: result.review_count,
      name: result.name,
      url: result.url,
      image_url: result.image_url,
      address1: result.address1,
      city: result.location.city,
      state: result.location.state,
      zip_code: result.location.zip_code,
      display_phone: result.display_phone,
      location: result.location.display_address,
      active: result.active,
      going: result.going,
      userGoogle: req.user.google,
      userFacebook: req.user.facebook,
      userTwitter: req.user.twitter
    }];
    var prettyJson = JSON.stringify(allbar, null, 4);
    //console.log(prettyJson);
    console.log('I received a bar POST call');
    AllBar.create(allbar).then(function(allbar){
    });
    var allbar = new AllBar(allbar);
    res.redirect('/add');
  });
  // render the all bars page
  app.get('/allBars', isLoggedIn, function(req, res){
    if (req.user) {
      AllBar.find({})
      .exec(function(err, allbars){
        if (err){
          res.send('error has occured!');
        } else {
          //console.log(allbars);
          res.render('pages/allBars', {user:req.user, allbars: allbars})
        }
      })
    }
  });
  // Add an attendee
    app.get('/going', function(req, res){
      var id = req.query.id;
      //console.log(id);
      AllBar.findByIdAndUpdate(id,
        { $inc: {going: 1}
      },
      function(err, bar) {
        if (err)  {
          console.log('error');
        } else {
          //console.log(bar);
          res.redirect('/allBars');
        }
      })
    });
    // Subtract an attendee
      app.get('/notGoing', function(req, res){
        var id = req.query.id;
        //console.log(id);
        AllBar.findByIdAndUpdate(id,
          { $inc: {going: -1}
        },
        function(err, bar) {
          if (err)  {
            console.log('error');
          } else {
            //console.log(bar);
            res.redirect('/allBars');
          }
        })
      });

  //get all bars for searchresults
    app.get('/getAllBars', function(request, response) {
      console.log('all bars page!');
    Bar.find({})
      .exec(function(err, bars){
        if (err){
          response.send('error has occured!');
        } else {
          //console.log(bars);
          console.log('these are pins sent to searchresults page');
          response.json({user : request.user, "bars": bars});
        }
      })
    });
  // render the settings page
  app.get('/myInfo',isLoggedIn, function(request, response) {
    request.user.getCustomData(function(err, data) {
      response.render('pages/settings');
    });
  });

  app.post('/updateInfo', isLoggedIn, function(request, response) {
    request.user.getCustomData(function(err, data) {
      data.city = request.body.city;
      data.state = request.body.state;
      data.save(function() {
        request.user.givenName = request.body.firstname;
        request.user.surname = request.body.lastname;
        request.user.save();
        response.redirect("/myInfo?updated=true");
      });
    });
  });
  //move bar to all bar
  app.get('/moveBar', function(req, res){
    var id = req.query.id;
    Bar.findOne({ _id: id }, function(err, bar){
      //console.log(bar);
      if (err) {
        res.send('error swapping');
      } else {
        var allbar = [{
          yelp_rating:  bar.yelp_rating,
          review_count: bar.review_count,
          name: bar.name,
          url: bar.url,
          image_url: bar.image_url,
          address1: bar.address1,
          city: bar.location.city,
          state: bar.location.state,
          zip_code: bar.location.zip_code,
          display_phone: bar.display_phone,
          location: bar.location,
          active: bar.active,
          going: bar.going,
          userGoogle: req.user.google,
          userFacebook: req.user.facebook,
          userTwitter: req.user.twitter
        }];
        //console.log(allbar);
        AllBar.create(allbar).then(function(allbar){
        });
        var allbar = new AllBar(allbar);
        bar.remove();
        console.log('bar moved');
        res.redirect('/searchresults');
      }
    });
  });
  //delete bar
  app.get('/deleteBar', function(req, res){
    var id = req.query.id;
    //console.log(req.query.id);
    AllBar.findOneAndRemove({ _id: id }, function(err, allbar){
      if (err) {
        res.send('error deleting');
      } else {
        console.log('Bar deleted');
        res.redirect("/myBars");
      }
    })
  });
  // render the user page of the app
  app.get('/userWall',isLoggedIn, function(req, res) {
    if (req.user) {
      res.render('pages/user', { user : req.user.email });
    }
    else if (req.session.user) {
      res.render('pages/user', { user : req.session.user});
    }
    else {
      res.render('pages/user', { user : null });
    }
  });

  // render the add image page
  app.get('/add', isLoggedIn, function(req, res){
    console.log('Add bar page');
    var user = req.user;
    //console.log(user);
    if (req.user) {
      res.render('pages/add', { user : req.user });
    }});
    //display bar search results
    app.get('/searchresults', isLoggedIn, function(req, res){
      var user = req.user;
      console.log('searchresults page!');
      Bar.find({})
      .exec(function(err,bars){
        if(err){
          res.send('error has occured');
        } else {
          res.render('pages/searchresults', { user : req.user, bars: bars });
        }
      })
    });

    app.get('/api/recentsearchs', (req, res, next) =>{
      searchTerm.find({}, (err, data)=>{
        res.json(data);
      })
    });
// search for the bar data to add bars to the database
app.get('/barData', isLoggedIn, function(request, response){
  var user = request.user;
  //console.log(user);
  //console.log(request.query);
  if(request.query.city && request.query.state) {
      cityandstate = (request.query.city + "," + request.query.state);
      //console.log(cityandstate);
      const clientId = 'nUZV_iCAO7Lwk1hv6pf-0A';
      const clientSecret =  'X4BffBQ1U1YKaKSm0phUrE6KDYDcC4n8f4jFYxMob7CQ7iJ8eHNWtCRvKHk0UOID';
      const searchRequest = {
          term:'bars',
          location: cityandstate
        };
  console.log(cityandstate);
  yelp.accessToken(clientId, clientSecret).then(response => {
    const client = yelp.client(response.jsonBody.access_token);
    client.search(searchRequest).then(response => {
      const result = response.jsonBody.businesses[0];
      var newYelp = [];
     for(var i=0; i<10; i++){
        newYelp.push({
          yelp_rating:  response.jsonBody.businesses[i].rating,
          review_count: response.jsonBody.businesses[i].review_count,
          name: response.jsonBody.businesses[i].name,
          url: response.jsonBody.businesses[i].url,
          image_url: response.jsonBody.businesses[i].image_url,
          address1: response.jsonBody.businesses[i].address1,
          city: response.jsonBody.businesses[i].location.city,
          state: response.jsonBody.businesses[i].location.state,
          zip_code: response.jsonBody.businesses[i].location.zip_code,
          display_phone: response.jsonBody.businesses[i].display_phone,
          location: response.jsonBody.businesses[i].location.display_address,
          active: true,
          going: 0,
          userGoogle: request.user.google,
          userFacebook: request.user.facebook,
          userTwitter: request.user.twitter,
        });
      }
      var prettyJson = JSON.stringify(newYelp, null, 4);
        var bar = newYelp;
        Bar.create(bar).then(function(bar){
          var bar = new Bar();
       console.log('Saved "bar" to database');
     });
      })
  });
  response.redirect('/searchresults');
  }
  //response.redirect('/searchresults');
  });

//delete all bars and start new search
app.get('/newSearch', isLoggedIn, function(req, res){
  var user = req.user;
  console.log('new search started');
  Bar.remove({})
  .exec(function(err,bars){
    if(err){
      res.send('error has occured');
    } else {
      console.log('removed bars in the database');
      res.redirect('/add');
    }
  })
});

// clear the session
app.get('/clearSession', function(req, res) {
  req.session.destroy(function(err) {
    // cannot access session here
  });
  res.json({"data":"cleared"});
});

// render the my bars page
app.get('/myBars', isLoggedIn, function(req, res){
  if (req.user) {
    AllBar.find({})
    .exec(function(err, allbars){
      if (err){
        res.send('error has occured!');
      }else {
        res.render('pages/myBars', {user:req.user, allbars: allbars})
      }
    })
  }
});
//If logged in
function isLoggedIn (req, res, next) {
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/login');
};
};
