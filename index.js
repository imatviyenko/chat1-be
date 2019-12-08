const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    console.log(`Handling get request, timestamp: ${new Date().toString()}`);
    res.send('Hello World!');

});
app.listen(port, () => console.log(`Example app listening on port ${port}!`));