const path = require('path');

function requireNoCache(filename)
{
    delete require.cache[filename];
    return require(filename);
}

exports.crawlerConf = function() {
    return requireNoCache(
        path.resolve(__dirname, './configs/crawler.js')
    );
};

/**
 * 
 */
exports.userAgentArr = function() {
    return requireNoCache(
        path.resolve(__dirname, './configs/user_agent.js')
    );
};

/**
 * 
 */
exports.proxyArr = function() {
    return requireNoCache(
        path.resolve(__dirname, './configs/proxy.js')
    );
};

/**
 * 
 */
exports.viewportArr = function() {
    return requireNoCache(
        path.resolve(__dirname, './configs/viewport.js')
    );
};