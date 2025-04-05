const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
app.use(express.static("public"));

app.listen(port, () => {
    if (port === 3000)
        console.log(`Frontend running on http://localhost:3000`);
});