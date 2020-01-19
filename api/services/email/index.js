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
    const body = `<p>Dear ${displayName},</p><p>Please click on the link to confirm your email and complete registration in the chat system: <a href="${confirmationLinkUrl}">Confirm Email</a></p>`;

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

    const subject = `Registration link`;
    const body = `<p>You are invited by '${userDisplayName}' ${userEmail} to register in the chat system,</p><p> Please click on the link to register: <a href="${registrationLinkUrl}">Registration Link</a></p>`;

    return emailAlerts.create(email, constants.EMAIL_TYPE_REGISTRATION_REQUEST, subject, body);
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

    const subject = `Registration link`;
    const notificationText = chatType === constants.CHAT_TYPE_PRIVATE ?
        `There are new messages from ${authorEmail} in private chat ${chatDisplayName}.`
        :
        `There are new messages from ${authorEmail} in group chat ${chatDisplayName}.`;

    const body = `<p>Dear ${displayName},</p><p>${notificationText}. <a href="${linkUrl}">Login to chat system</a></p>`;

    return emailAlerts.create(email, constants.EMAIL_TYPE_NEW_MESSAGES, subject, body);
}

module.exports = {
    sendConfirmEmailLink,
    sendRegistrationRequest,
    sendNewMessagesNotification
};