module.exports =  {
    MIN_USER_DISPLAY_NAME_LENGTH: 3,
    MAX_USER_DISPLAY_NAME_LENGTH: 50,
    MIN_PASSWORD_LENGTH: 3,
    MAX_PASSWORD_LENGTH: 30,
    USER_STATUS_ACTIVE: 'active',
    USER_STATUS_CONFIRMATION_PENDING: 'confirmation_pending',
    USER_STATUS_REGISTRATION_PENDING: 'registration_pending',
    USER_STATUS_DISABLED: 'disabled',
    ERROR_SUCCESS: 'success',
    ERROR_GENERIC_SERVER_FAILURE: 'ERROR_GENERIC_SERVER_FAILURE',
    ERROR_USER_NOT_FOUND: 'ERROR_USER_NOT_FOUND',
    ERROR_DATABASE_FAILURE: 'ERROR_DATABASE_FAILURE',
    ERROR_INVALID_PARAMETERS: 'ERROR_INVALID_PARAMETERS',
    ERROR_API_CALL_FAILED: 'ERROR_API_CALL_FAILED',
    ERROR_AUTH_INVALID_CREDENTIALS: 'ERROR_AUTH_INVALID_CREDENTIALS',
    ERROR_AUTH_USER_ALREADY_ONLINE: 'ERROR_AUTH_USER_ALREADY_ONLINE',
    ERROR_REGISTRATION_EMAIL_SENDING_FAILURE: 'ERROR_REGISTRATION_EMAIL_SENDING_FAILURE',
    ERROR_REGISTRATION_USER_ALREADY_EXISTS: 'ERROR_REGISTRATION_ACTIVE_USER_ALREADY_EXISTS',
    ERROR_REGISTRATION_USER_NOT_FOUND: 'ERROR_REGISTRATION_USER_NOT_FOUND',
    ERROR_REGISTRATION_INVALID_CODE: 'ERROR_REGISTRATION_INVALID_CODE',
    ERROR_JWT_INVALID_TOKEN: 'ERROR_JWT_INVALID_TOKEN',
    CHAT_TYPE_PRIVATE: 'CHAT_TYPE_PRIVATE',
    CHAT_TYPE_GROUP: 'CHAT_TYPE_GROUP',
    EVENT_USER_ONLINE: 'EVENT_USER_ONLINE',
    EVENT_USER_OFFLINE: 'EVENT_USER_OFFLINE',
    EVENT_USER_PROFILE_UPDATED: 'EVENT_USER_PROFILE_UPDATED',
    EVENT_CHAT_UPDATED: 'EVENT_CHAT_UPDATED',
    EVENT_CHAT_NEW_MESSAGES: 'EVENT_CHAT_NEW_MESSAGES',
    PING_SERVER_INTERVAL_SECONDS: 60, // how often do clients ping the server via WebSocket to update online timestamp
    STALE_USER_MISSED_PINGS_COUNT: 2, // how many pings from the client may be missed before the user is considered stale and the status must be reset to offline
    EMAIL_TYPE_CONFIRMATION_LINK: 'confirmation_link',
    EMAIL_TYPE_REGISTRATION_REQUEST: 'registration_request',
    EMAIL_TYPE_NEW_MESSAGES: 'new_messages',
    EMAIL_STATUS_QUEUED: 'queued',
    EMAIL_STATUS_SENT: 'sent',
    EMAIL_STATUS_FAILED: 'failed',
    MAX_USERS_PER_GROUP_CHAT: 10
};