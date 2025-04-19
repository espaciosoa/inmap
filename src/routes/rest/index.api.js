const express = require('express')
const router = express.Router()



router.get('/', async (req, res) => {



    const allEndpoints =getAllExpressEndpoints(req.app, {path:"v1/API/"})
    const postEndpoints =getAllExpressEndpoints(req.app, {method:"POST"})

    
    console.log(allEndpoints)
    console.log(postEndpoints)

    res.send(
        "<h1>API Endpoints</h1>"+
           allEndpoints.map( e => { return `<p>${e.method} ${e.path}</p>`})
    )

});

function getAllExpressEndpoints(app, filter = {}) {
    const endpoints = [];
    app._router.stack.forEach(collect.bind(null, [], endpoints, filter));
    return endpoints;
}

function collect(path, endpoints, filter, layer) {
    if (layer.route) {
        layer.route.stack.forEach(collect.bind(null, path.concat(split(layer.route.path)), endpoints, filter));
    } else if (layer.name === 'router' && layer.handle.stack) {
        layer.handle.stack.forEach(collect.bind(null, path.concat(split(layer.regexp)), endpoints, filter));
    } else if (layer.method) {
        const method = layer.method.toUpperCase();
        const fullPath = path.concat(split(layer.regexp)).filter(Boolean).join('/');

        // Apply filters
        const methodMatches = filter.method ? method === filter.method.toUpperCase() : true;
        const pathMatches = filter.path ? fullPath.includes(filter.path) : true;

        if (methodMatches && pathMatches) {
            endpoints.push({ method, path: fullPath });
        }
    }
}

function split(thing) {
    if (typeof thing === 'string') {
        return thing.split('/');
    } else if (thing.fast_slash) {
        return '';
    } else {
        var match = thing.toString()
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '$')
            .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//);
        return match
            ? match[1].replace(/\\(.)/g, '$1').split('/')
            : '<complex:' + thing.toString() + '>';
    }
}



module.exports = router