const config = require('./config');

const app = require('./app');
const port = config.port;
app.set('port', port);

const mongoose = require('mongoose');
const mongodbUri = config.mongodbUri;
console.log('mongodbUri: ', mongodbUri);


mongoose.connect(mongodbUri, {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
});

app.listen(port, () => console.log(`Exrpess is listening on port ${port}!`));