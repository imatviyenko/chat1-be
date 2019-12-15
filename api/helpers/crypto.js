const bcrypt = require('bcryptjs');

// https://itnext.io/password-encryption-hashing-in-node-application-311a6f61cd65
async function getPasswordHash(password) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}

module.exports = {
    getPasswordHash
};