const bcrypt = require('bcryptjs');

const constants = require('../../../constants');
const config = require('../../../config');
const {createCustomError} = require('../../../errors');

// https://itnext.io/password-encryption-hashing-in-node-application-311a6f61cd65
async function getPasswordHash(password) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}


async function validatePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

function encodeString(plainTextString) {
    return `${config.serverSecret}.${plainTextString}`;
}

function decodeString(encryptedString) {
    if (!encryptedString || !encryptedString.includes(`${config.serverSecret}.`)) throw createCustomError('CryptoError', 'Error decrypting string');
    return encryptedString.replace(`${config.serverSecret}.`, '');
}

function getAuthToken(user) {
    return `${config.serverSecret}:${user.email}`;
}

module.exports = {
    getPasswordHash,
    validatePassword,
    encodeString,
    decodeString,
    getAuthToken
};