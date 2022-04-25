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
    title: {type:String, required:true, index:{unique:true}},
    year: {type:String, required:true},
    genre:
        {
            type:String,
            required:true
            // , enum: ["Action" , "Adventure" , "Comedy" , "Drama" , "Fantasy" , "Horror" , "Mystery" , "Thriller" , "Western"]
        },
    actors: //want to require 3 actors
    [
        {actorName: {type:String, required:true}, characterName:{type:String, required:true}},
        {actorName: {type:String, required:true}, characterName:{type:String, required:true}},
        {actorName: {type:String, required:true}, characterName:{type:String, required:true}}
    ]
});

//return the model to server
module.exports = mongoose.model('Movie', MovieSchema);
