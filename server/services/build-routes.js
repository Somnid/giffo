const { promisify } = require("util");
const path = require("path");
const fs = require("fs");
const readdirAsync = promisify(fs.readdir);

const buildRoutes = async app =>
    readdirAsync(`${process.cwd()}/server/api`)
        .then(files => 
            files.map(file => file.replace(/\.js/, ""))
                 .forEach(path => app.get(`/${path}`, require(`${process.cwd()}/server/api/${path}`))));

module.exports = {
    buildRoutes
};