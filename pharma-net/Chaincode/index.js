'use strict';

//Module for User Organization
const usercontract = require('./contract-user');

//Module for Registrar Organization
const registrarcontract = require('./contract-registrar');

//Export the contracts
module.exports.contracts = [usercontract, registrarcontract];
