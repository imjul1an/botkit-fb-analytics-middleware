const request = require('request');

module.exports = function (config) {
    const { app_id, page_token, page_id, } = config || {};

    if (!app_id) {
        console.log('Failed to initialize Botkit-Fb-Analytics-Middleware. "app_id" is missing.');
        return;
    }

    if (!page_token) {
        console.log('Failed to initialize Botkit-Fb-Analytics-Middleware. "page_token" is missing.');
        return;
    }

    if (!page_id) {
        console.log('Failed to initialize Botkit-Fb-Analytics-Middleware. "page_id" is missing.');
        return;
    }

    return {
        receive: (bot, message, next) => {
            sendEventToFbAnalytics(bot, message, config);
            next();
        },
        send: (bot, message, next) => {
            sendEventToFbAnalytics(bot, message, config);
            next();
        },
        // Enhence BotKit's controller with analytcis object, so you can send custom events explicitly.
        analytics: {
            send: (bot, message) => {
                sendEventToFbAnalytics(bot, message, config);
            }
        }
    }
}

const sendEventToFbAnalytics = (bot, message, config) => {
    try {
        const eventData = transformEvent(bot, message);
        sendEvent(Object.assign({}, config, eventData));
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
    recipientId,
    event_name = 'Default Custom Event Name',
    api_host = 'https://graph.facebook.com',
    api_version = 'v2.11',
}) => {
    request.post({
        url: `${api_host}/${api_version}/${app_id}/activities?${page_token}`,
        form: {
            event: 'CUSTOM_APP_EVENTS',
            custom_events: JSON.stringify([{ _eventName: event_name, _valueToSum: 1 }]),
            advertiser_tracking_enabled: 1,
            application_tracking_enabled: 1,
            extinfo: JSON.stringify(['mb1']),
            page_id: page_id,
            page_scoped_user_id: recipientId
        }
    }, (err, res, body) => {
        if (err) {
            console.log(`Error. Failed to send custom event: ${event_name} to Facebook Analytics.`);
        } else {
            console.log(`Fb analytics custom event ${event_name} has been send. Response: ${body}`);
        }
    });
}
