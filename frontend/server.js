const express = require("express");
const app = express();
// Render przydziela port przez zmienną środowiskową
const port = process.env.PORT || 3000;

app.use(express.static("public"));

app.listen(port, () => {
    console.log(`Frontend running on https://e-greedy-alerts.onrender.com:${port}`);
});