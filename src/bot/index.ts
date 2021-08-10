import TelegramBot from 'node-telegram-bot-api';
import { Tbot } from '../types/Tbot';
import server from '../server';


const joinListeners = (bot: TelegramBot, customBot: Tbot, config: object) => {
    bot.onText(/start/, (msg: TelegramBot.Message) => {
      customBot.sendTextMessage(msg.from?.id, 'Привіт! \nНадішліть боту файл, щоб принтер його роздрукував.\n!Тільки у форматі .pdf');
    })
    bot.on('message', (msg: TelegramBot.Message) => {
      console.log((msg.from?.username || msg.from?.first_name) + ' sent a message');
      if(msg.document){
        customBot.sendTextMessage(msg.from?.id, 'Скільки зробити копій?');
        server.writeToBd(msg, config);
      }else{
        console.log('not the documnet');
      }
    });

    bot.on('callback_query', (msg: TelegramBot.CallbackQuery) => {
      console.log(msg.from.username + ' pressed the button');
      server.queryProccess(customBot, msg, config);
    });

    bot.onText(/[0-9]+/, (msg: TelegramBot.Message) => {
      server.prepearingForPrinting(customBot, msg, config);
    });
    return bot;
}
const createCustomBot = (bot: TelegramBot) => {
    return {
        /**
         * Sends a message to a user by their telegram name
         * @param chatId Telegram name of a user
         * @param text A massage text
         */
        sendTextMessage: async (
          chatId: string | number,
          text: string
        ): Promise<TelegramBot.Message> => {
          try {
            const result = await bot.sendMessage(chatId, text);    
            return result;
          } catch (error) {
            console.log(error);
            return error;
          }
        },
        
        /** @param doc */

        sendDocument: async (
          chatId: string,
          doc: string,
          options: TelegramBot.SendDocumentOptions
        ): Promise<TelegramBot.Message> => {
          try {
            const result = await bot.sendDocument(chatId, doc, options);
            return result;
          } catch (error) {
            console.log(error);
            return error;
          }
        },

        sendButtons: async (
          chatId: string,
          text: string,
          options: TelegramBot.SendMessageOptions
        ): Promise<TelegramBot.Message> => {
          try {
            const result = await bot.sendMessage(chatId, text, options);
            return result;
          } catch (error) {
            console.log(error);
            return error;
          }
        },
    
        /**
         * Sends a photo to a user
         * @param telegramName Telegram name of a user
         * @param photo A web-link for a photo or a telegram file_id
         * @param caption A caption for the photo
         */
        sendPhoto: async (
          chatId: string,
          photo: string,
          options: TelegramBot.SendPhotoOptions
        ): Promise<TelegramBot.Message> => {
          try {
            const result = await bot.sendPhoto(chatId, photo, options);
            return result;
          } catch (error) {
            console.log(error);
            return error;
          }
        },
      };
}

export default {
    joinListeners,
    createCustomBot
  };
  