if (!process.env.page_token) {
    console.log('Error: Specify page_token in environment');
    process.exit(1);
}

if (!process.env.verify_token) {
    console.log('Error: Specify verify_token in environment');
    process.exit(1);
}

if (!process.env.app_secret) {
    console.log('Error: Specify app_secret in environment');
    process.exit(1);
}


var botkit = require('botkit');

var controller = botkit.facebookbot({
    debug: true,
    log: true,
    access_token: process.env.page_token,
    verify_token: process.env.verify_token,
    app_secret: process.env.app_secret,
    validate_requests: true, // Refuse any requests that don't come from FB on your receive webhook, must provide FB_APP_SECRET in environment variables
});

// The controller object is then used to spawn() bot instances that represent a specific bot identity and connection to Slack. Once spawned and connected to the API, the bot user will appear online in Slack, and can then be used to send messages and conduct conversations with users
var bot = controller.spawn({});

controller.setupWebserver(process.env.PORT || 3000, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function() {
        console.log('ONLINE!');
    });
});

controller.api.nlp.enable();
controller.api.messenger_profile.greeting('Hey');
controller.api.messenger_profile.get_started('sample_get_started_payload');
controller.api.messenger_profile.menu([{
    "locale":"default",
    "composer_input_disabled":false,
    "call_to_actions":[
        {
            "title":"Nested menu",
            "type":"nested",
            "call_to_actions":[
                {
                    "title":"Quick reply",
                    "type":"postback",
                    "payload":"get-quick-replies"
                },
                {
                    "title":"Reply with typing",
                    "type":"postback",
                    "payload":"reply-with-typing"
                }
            ]
        },
        {
            "type":"web_url",
            "title":"Google",
            "url":"https://google.com",
            "webview_height_ratio":"full"
        }
    ]
},
    {
        "locale":"default",
        "composer_input_disabled":false
    }
]);

controller.on('facebook_postback', function(bot, message) {

    if (message.payload == 'sample_get_started_payload' || message.payload == 'get-quick-replies') {
      bot.reply(message, {
          text: 'Hey! This message has some quick replies attached.',
          quick_replies: [
              {
                  "content_type": "text",
                  "title": "Yes",
                  "payload": "yes",
              },
              {
                  "content_type": "text",
                  "title": "No",
                  "payload": "no",
              }
          ]
      });
    }

});

controller.hears(['*'], 'message_received', function(bot, message) {
  bot.replyWithTyping(message, 'Hello there, my friend!');
});
