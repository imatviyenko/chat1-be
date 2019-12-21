const constants = require('../../../constants');
const config = require('../../../config');
const {encodeString} = require('../crypto');
const timeoutInSeconds = 5;


async function sendConfirmEmailLink(email, displayName) {
    const code = encodeString(email);
    const frontEndBaseUrl = config.frontEndUrl.replace(/\/$/, '');
    const confirmationLinkUrl = `${frontEndBaseUrl}/confirm/${code}`;
    console.log('*************************************************');
    console.log('sendConfirmEmailLink -> confirmationLinkUrl: ', confirmationLinkUrl);
    console.log('*************************************************');

    const result = {status: constants.ERROR_SUCCESS};
    return new Promise( (resolve, reject) => {
        setTimeout(resolve(result), timeoutInSeconds * 1000);
    });
}

module.exports = {
    sendConfirmEmailLink
};