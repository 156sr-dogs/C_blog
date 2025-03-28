const express = require('express');
const app = express();
let count = 0;

app.use(express.json());

app.get('/like', (req, res) => {
    count++;
    res.json({ count });
});

app.listen(3000);