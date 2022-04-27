var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

//mongoose.connect(process.env.DB, { useNewUrlParser: true });
try {
    mongoose.connect( process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true}, () =>
        console.log("connected"));
}catch (error) {
    console.log("could not connect");
}
mongoose.set('useCreateIndex', true);

var MovieSchema = new Schema({
    title: {type:String, required:true, index:{unique:true}}, //index:true will make mongo throw code 11000 for duplicated entry
    year: {type:String, required:true},
    genre: {type:String, required:true},
    actors: //want to require 3 actors
    [
        {actorName: {type:String, required:true}, characterName:{type:String, required:true}},
        {actorName: {type:String, required:true}, characterName:{type:String, required:true}},
        {actorName: {type:String, required:true}, characterName:{type:String, required:true}}
    ],
    imageUrl: {type: String, required: false}
});

MovieSchema.pre('save', function(next)
{
    var movie = this; //maybe?
    next();
});

//return the model to server
module.exports = mongoose.model('Movie', MovieSchema);
