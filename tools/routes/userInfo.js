var express = require('express');
var router = express.Router();

router.get('/userInfo', function(req, res, next) {
    res.json(require('../../mocks/userInfo.json'));
})

module.exports = router;
