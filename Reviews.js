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
    username:
        {
            type: String,
            required: true
        },
    movie:
        {
            type: String,
            required: true
        },
    rating:
        {
            type: String,
            required: true
        },
    review:
        {
            type: String,
            required: true
        }
});

ReviewSchema.pre('save', function(next)
{
    next();
});

//return the model to server
module.exports = mongoose.model('Review', ReviewSchema);