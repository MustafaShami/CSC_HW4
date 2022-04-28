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

var ReviewSchema = new Schema({
    user: {type: String, required: true},
    movieTitle: {type: String, required: true},
    rating: {type: any, required: true},
    review: {type: String, required: true, index:{unique:true}} //index:true will make mongo database throw code 11000 for duplicated entry
});

ReviewSchema.pre('save', function(next)
{
    var review = this; //maybe?
    next();
});

//return the model to server
module.exports = mongoose.model('Review', ReviewSchema);