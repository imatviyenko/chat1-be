const app = require('./app');
const port = process.env.PORT || 3001;
app.set('port', port);

const mongoose = require('mongoose');
const mongodbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chat1';
mongoose.connect(mongodbUri, {useNewUrlParser: true, useUnifiedTopology: true});

app.listen(port, () => console.log(`Exrpess is listening on port ${port}!`));