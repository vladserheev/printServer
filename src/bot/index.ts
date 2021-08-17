import TelegramBot from 'node-telegram-bot-api';
import { Tbot } from '../types/Tbot';
import server from '../server';
let bd: any[] = [];

const askCopiesNumber = async (bot: Tbot, id: number | undefined, msgId: number | undefined) => {
  //if(!server.checkIfSomeReqWithNoCopiesNum(id, config.users_bd_path)){ // return false if there is only one new request in bd from user
  if((bd[0]) && bd[0].user_id === id && bd[0].message_id === msgId){
    await bot.sendTextMessage(id, 'Скільки зробити копій?', {"reply_to_message_id": msgId});
  }
  return false
}

async function joinListeners(bot: TelegramBot, customBot: Tbot, config: object){
    bot.onText(/start/, (msg: TelegramBot.Message) => {
      customBot.sendTextMessage(msg.from?.id, 'Привіт! \nНадішліть боту файл, щоб принтер його роздрукував.\n!Тільки у форматі .pdf');
    });
    bot.on('message', async (msg: TelegramBot.Message) => {
      if(msg.document){
        console.log(msg);
        console.log((msg.from?.username || msg.from?.last_name) + ' sent a document');
        await server.writeToBd(msg, config);
        const req = {
          "user_id": msg.from?.id,
          "message_id": msg.message_id,
          "file_id": msg.document?.file_id,
          "username": msg.from?.username,
          "copiesNumber": 0,
          "filePath": 0
      };
        bd.push(req);
        await askCopiesNumber(customBot, msg.from?.id, msg.message_id);
      }
    });

    bot.on('callback_query', (msg: TelegramBot.CallbackQuery) => {
      console.log(msg.from.username + ' pressed the button');
      server.queryProccess(customBot, msg, config);
    });

    bot.onText(/[0-9]+/, async (msg: TelegramBot.Message) => {
      await server.prepearingForPrinting(customBot, msg, bd[0], config);
      bd.shift();
      if(bd[0]){
        await askCopiesNumber(customBot, msg.from?.id, bd[0].message_id);
      }
      //server.prepearingForPrinting(customBot, msg, config);
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
        * @param fileId
        * @param downloadDir
        */

        downloadFile: async (
          fileId: string,
          downloadDir: string
        ): Promise<unknown> => {
          try {
            const result = await bot.downloadFile(fileId, downloadDir);
            return result;
          } catch (error) {
            console.log(error);
            return false
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
    
          sendChatAction: async (
           chatId: string,
           action: TelegramBot.ChatAction
         ): Promise<unknown> => {
           try {
            await bot.sendChatAction(chatId, action);
           } catch (error) {
            return error
           }
         }
      };
}

export default {
    joinListeners,
    createCustomBot
  };
  