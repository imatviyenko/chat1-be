const logger = require('../../../logger');

const constants = require('../../../constants');
const config = require('../../../config');
const {encodeString} = require('../crypto');
const timeoutInSeconds = 5;
const emailAlerts = require('../database/emailAlerts');

async function sendConfirmEmailLink(email, displayName) {
    const codeString = JSON.stringify({email: email});
    const code = encodeString(codeString);
    const frontEndBaseUrl = config.frontEndUrl.replace(/\/$/, '');
    const confirmationLinkUrl = `${frontEndBaseUrl}/#/confirm/${code}`;

    logger.log('*************************************************');
    logger.log(`sendConfirmEmailLink -> confirmationLinkUrl: ${confirmationLinkUrl}`);
    logger.log('*************************************************');

    const subject = `Confirm email`;
    const body = `<p>Dear ${displayName}</p><p>Please click on the link to confirm your email and complete registration in the chat system: <a href="${confirmationLinkUrl}">Confirm Email</a></p>`;

    return emailAlerts.create(email, constants.EMAIL_TYPE_CONFIRMATION_LINK, subject, body);
}


async function sendRegistrationRequest(userEmail, userDisplayName, contactEmail) {
    const codeString = JSON.stringify({email: contactEmail});
    const code = encodeString(codeString);
    const frontEndBaseUrl = config.frontEndUrl.replace(/\/$/, '');
    const registrationLinkUrl = `${frontEndBaseUrl}/#/register/${code}`;
    logger.log('*************************************************');
    logger.log(`sendRegistrationRequest -> registrationLinkUrl: ${registrationLinkUrl}`);
    logger.log('*************************************************');

    const result = {status: constants.ERROR_SUCCESS};
    return new Promise( (resolve, reject) => {
        setTimeout(resolve(result), timeoutInSeconds * 1000);
    });
}


async function sendNewMessagesNotification(userEmail, authorEmail, chatType, chatDisplayName) {
    const frontEndBaseUrl = config.frontEndUrl.replace(/\/$/, '');
    const linkUrl = frontEndBaseUrl;
    const _chatName = chatType === constants.CHAT_TYPE_PRIVATE ? 
        `private chat with user ${authorEmail}`
        :
        `group chat ${chatDisplayName}`
    logger.log('*************************************************');
    logger.log(`You got new messages in ${_chatName}`);
    logger.log(`Login to the chat system to read the messages:`);
    logger.log(`sendNewMessagesNotification -> linkUrl: ${linkUrl}`);
    logger.log('*************************************************');

    const result = {status: constants.ERROR_SUCCESS};
    return new Promise( (resolve, reject) => {
        setTimeout(resolve(result), timeoutInSeconds * 1000);
    });

}

module.exports = {
    sendConfirmEmailLink,
    sendRegistrationRequest,
    sendNewMessagesNotification
};