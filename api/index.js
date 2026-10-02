const app = require('../addon.js');

module.exports = (req, res) => {
    return app(req, res);
};
