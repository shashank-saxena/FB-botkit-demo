/* global process:false */

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
// controller.api.messenger_profile.delete_menu();
controller.api.messenger_profile.menu([{
  'locale':'default',
  'composer_input_disabled':false,
  'call_to_actions':[
    {
      'title':'Quick reply',
      'type':'postback',
      'payload':'get-quick-replies'
    },
    {
      'title':'Reply with typing',
      'type':'postback',
      'payload':'reply-with-typing'
    },
    {
      'type':'web_url',
      'title':'Google',
      'url':'https://google.com',
      'webview_height_ratio':'full'
    }
  ]
}
]);

controller.on('facebook_postback', function(bot, message) {
  console.log(message.payload);

  if (message.payload == 'sample_get_started_payload' || message.payload == 'get-quick-replies') {
    bot.reply(message, getQuickReplies('Hey! This message has some quick replies attached.'));
  }
});

controller.on('message_received', function(bot, message) {
  console.log(message);
  if (!message.quick_reply) {
    bot.replyWithTyping(message, getQuickReplies('Replied with typing indicators!'));
    return;
  }

  switch (message.quick_reply.payload) {
  case 'text':
    bot.reply(message, getQuickReplies('plain text :)'));
    break;
  case 'text-with-link':
    bot.reply(message, getQuickReplies('Text with link read more[https://www.google.co.in/]'));
    break;
  case 'template-with-link':
    var text = getLinkTemplate();
    bot.reply(message, getQuickReplies(null, text));
    break;
  case 'list':
    var listStr = getListData();
    bot.reply(message, getQuickReplies(listStr));
    break;
  case 'attachment':
    var attachmentObj = {
      'type':'image',
      'payload':{ 'url':'https://istbinglesb.files.wordpress.com/2010/09/hello.jpg' }
    };
    bot.reply(message, getQuickReplies(null, attachmentObj));
    break;
  default:
    bot.replyWithTyping(message, getQuickReplies('Replied with typing indicators!'));
  }
});

// private
function getListData(bulletHead) {
  var list = {
    'text': 'Following bullets:',
    'bullets': ['one', 'two', 'three', 'four', 'five']
  };

  var listBulletsStr = '';
  var spacesToIndent = '    ';
  for (var i = 0; i < list.bullets.length; i++) {
    listBulletsStr += spacesToIndent + (bulletHead || (i+1)) + '. ' + list.bullets[i];

    if (i < list.bullets.length) {
      listBulletsStr += '\r\n';
    }
  }

  return list.text + '\r\n' + listBulletsStr;
}

function getQuickReplies(msg, attachment) {
  var replies = {
    quick_replies: [{
      'content_type': 'text',
      'title': 'Plain text',
      'payload': 'text'
    },{
      'content_type': 'text',
      'title': 'Text with link',
      'payload': 'text-with-link'
    },{
      'content_type': 'text',
      'title': 'Template with link',
      'payload': 'template-with-link'
    },{
      'content_type': 'text',
      'title': 'List text',
      'payload': 'list'
    },{
      'content_type': 'text',
      'title': 'Attachment',
      'payload': 'attachment'
    }]
  };

  if (msg) {
    replies['text'] = msg;
  }

  if (!msg && attachment) {
    replies['attachment'] = attachment;
  }

  return replies;
}

function getLinkTemplate() {
  return {
    'type':'template',
    'payload':{
      'template_type':'button',
      'text': 'text data with link as button',
      'buttons': [{
        'type':'web_url',
        'url':'https://www.google.com',
        'title':'View the Terms',
        'webview_height_ratio': 'compact'
      }]
    }
  };
}
