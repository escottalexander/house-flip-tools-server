'use strict';
const { router: propertyRouter } = require('./propertyRouter');
const { router: userRouter } = require('./userRouter');

module.exports = { userRouter, propertyRouter };