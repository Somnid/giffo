const express = require("express");
const app = express();
const { buildRoutes } = require("./services/build-routes.js");

app.use(express.static("public"));
app.get("/", (req, res) => res.sendFile(`${process.cwd()}/public/index.html`));

buildRoutes(app)
    .then(_ => app.listen(1334, () => console.log(`App started on port ${1334}`)));