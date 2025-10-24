"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signoutRouter = void 0;
var express_1 = require("express");
var router = express_1.default.Router();
exports.signoutRouter = router;
router.post('/api/users/signout', function (req, res) {
    req.session = null;
    res.send({});
});
