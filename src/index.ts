import config from './config';
import telegramBot from './bot';
import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(config.telegram_token, {polling: true});
if(bot){
  console.log('bot has been created!');
  telegramBot.joinListeners(bot, telegramBot.createCustomBot(bot), config);
}
