const logger = require('../../../logger');

const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const crypto = require('crypto');

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
    // https://lollyrock.com/posts/nodejs-encryption/
    const cipher = crypto.createCipher(config.cipherAlgorithm, config.serverSecret);
    let crypted = cipher.update(plainTextString, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

function decodeString(encryptedString) {
    // https://lollyrock.com/posts/nodejs-encryption/
    const decipher = crypto.createDecipher(config.cipherAlgorithm, config.serverSecret);
    let dec = decipher.update(encryptedString, 'hex', 'utf8')
    dec += decipher.final('utf8');
    return dec;
}

function getAuthToken(user) {
    logger.log(`services.crypto.getAuthToken -> user: ${JSON.stringify(user)}`);
    const payload = {
        sub: user.email
    };

    const options = {
        algorithm: 'HS256',
        expiresIn: config.jwtLifetimeSeconds,
        issuer: config.jwtIssuer,
        audience: config.jwtAudience
    };

    const token = jsonwebtoken.sign(payload, config.serverSecret, options);
    logger.log(`services.crypto.getAuthToken -> token: ${token}`);
    return token;
    //return `${config.serverSecret}:${user.email}`;
}

function decodeAuthToken(token) {
    logger.log(`services.crypto.decodeAuthToken -> token: ${token}`);

    const options = {
        algorithm: 'HS256',
        expiresIn: config.jwtLifetimeSeconds,
        issuer: config.jwtIssuer,
        audience: config.jwtAudience
    };
    
    try {
        const decodedPayload = jsonwebtoken.verify(token, config.serverSecret, options);
        logger.log(`services.crypto.decodeAuthToken -> decodedPayload: ${JSON.stringify(decodedPayload)}`);
        return decodedPayload;
    } catch (e) {
        return null;
    }
}

module.exports = {
    getPasswordHash,
    validatePassword,
    encodeString,
    decodeString,
    getAuthToken,
    decodeAuthToken
};