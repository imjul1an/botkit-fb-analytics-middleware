"use strict";

const request = require("request");

module.exports = function (config = {}) {
    const { app_id, page_token, page_id, } = config;

    if (!app_id) {
        console.log('Error. Facebook analytics middleware is missing app_id. Provide valid app_id.');
        return;
    }

    if (!page_token) {
        console.log('Error. Facebook analytics middleware is missing page_token. Provide valid page_token.');
        return;
    }

    if (!page_id) {
        console.log('Error. Facebook analytics middleware is missing page_id. Provide valid page_id.');
        return;
    }

    return {
        // botkit receive middleware endpoint
        receive: (bot, message, next) => {
            sendEventToFbAnalytics(bot, message, config);
            next();
        },
        // botkit send middleware endpoint
        send: (bot, message, next) => {
            sendEventToFbAnalytics(bot, message, config);
            next();
        },
        // botkit controller enhencement
        analytics: {
            send: event_name => 
                sendEvent(Object.assign({}, config, event_name))
                    .catch((err) => {
                        // log an error and fail quietly.
                        console.log(`Error. Failed to send custom event: ${event_name} to Facebook Analytics.`);
                    })
        }
    }
}

const sendEventToFbAnalytics = (bot, message, config) => {
    try {
        const eventData = transformEvent(bot, message);

        return sendEvent(Object.assign({}, config, eventData)).catch((err) => {
            // log an error and fail quietly.
            console.log(`Error. Failed to send custom event: ${event_name} to Facebook Analytics.`);
        });
    } catch (err) {
        // ignore
    }
}

const transformEvent = (bot, message) => {
    const { event_name, sender: { id } } = message;

    return {
        event_name,
        recipientId: id
    }
}

const sendEvent = ({
    app_id,
    page_token,
    page_id,
    event_name,
    recipientId,
    api_host = 'https://graph.facebook.com',
    api_version = 'v2.11',
}) =>
    request.post({
        url: `${api_host}/${api_version}/${app_id}/activities?${page_token}`,
        form: {
            event: 'CUSTOM_APP_EVENTS',
            custom_events: JSON.stringify([{ _eventName: event_name }]),
            advertiser_tracking_enabled: 1,
            application_tracking_enabled: 1,
            extinfo: JSON.stringify(['mb1']),
            page_id: page_id,
            page_scoped_user_id: recipientId
        }
    })
