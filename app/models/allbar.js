var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var url = require('mongoose-type-url');


var AllBarSchema = new Schema({
     rating_img_url: String,
     yelp_rating:  Number,
     review_count: Number,
     name: String,
     url: mongoose.SchemaTypes.Url,
     image_url: mongoose.SchemaTypes.Url,
     address1: String,
     city: String,
     state: String,
     zip_code: Number,
     display_phone: String,
     location: String,
     going: Number,
     active: Boolean,
     userGoogle:  {
       id: String,
       token: String,
       name: String,
       email: String
     },
     userFacebook:  {
       id: String,
       token: String,
       name: String,
       email: String
     },
     userTwitter: {
       id: String,
       token: String,
       username: String,
       displayName: String
     }
});

var AllBar = mongoose.model('AllBar', AllBarSchema);

module.exports = AllBar;
