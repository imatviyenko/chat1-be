const logger = require('../../../../logger');

const constants = require('../../../../constants');
const config = require('../../../../config');
const EmailAlert = require('../models/EmailAlert');

// create new EmailAlert
async function create(email, type, subject, body) {
    logger.log(`services.emailAlerts.create invoked`);

    const emailAlert = {
        email,
        type,
        subject,
        body,
        status: constants.EMAIL_STATUS_QUEUED
    };
    logger.log(`services.emailAlerts.create -> emailAlert: ${JSON.stringify(emailAlert)}`);

    const docEmailAlert = new EmailAlert(emailAlert);
    const dbEmailAlert = await docEmailAlert.save();
    logger.log(`services.emailAlerts.create -> dbEmailAlert: ${JSON.stringify(dbEmailAlert)}`);
}

module.exports = {
    create
};