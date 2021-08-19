import TelegramBot from 'node-telegram-bot-api';
import { Config, Tbot, NewRequests, NewRequest} from '../types';
import server from '../server';


let newRequests: NewRequests = []; // this bd for requests that have no copiesNum yet

const askCopiesNumber = async (bot: Tbot, id: number | undefined, msgId: number | undefined) => {
  if((newRequests[0]) && newRequests[0].user_id === id && newRequests[0].message_id === msgId){
    await bot.sendTextMessage(id, 'Скільки зробити копій?', {"reply_to_message_id": msgId});
  }
  return false
}

async function joinListeners(bot: TelegramBot, customBot: Tbot, config: Config){
    bot.onText(/start/, (msg: TelegramBot.Message) => {
      customBot.sendTextMessage(msg.from?.id, 'Привіт! \nНадішли боту файл(.docs, .pdf, .xlsx, .txt), щоб принтер його роздрукував');
    });
    bot.on('message', async (msg: TelegramBot.Message) => {
      if(msg.document){
        if(!server.checkValidFile(msg.document, config.valid_files_conf)){
          console.log('not valid file_type');
          return false
        }
        if(!msg.from){
          return false
        }
        console.log(msg);
        console.log((msg.from?.username || msg.from?.last_name) + ' sent a document');
        await server.writeToBd(msg, config);
        const req:NewRequest = {
          "user_id": msg.from.id,
          "message_id": msg.message_id,
          "file_id": msg.document.file_id
      };
        newRequests.push(req);
        await askCopiesNumber(customBot, msg.from?.id, msg.message_id);
      }
    });

    bot.on('callback_query', (msg: TelegramBot.CallbackQuery) => {
      console.log(msg.from.username + ' pressed the button');
      server.queryProccess(customBot, msg, config);
    });

    bot.onText(/[0-9]+/, async (msg: TelegramBot.Message) => {
      if(!server.checkVslidNumber(Number(msg.text))){
        console.log('Not valid number');
        customBot.sendTextMessage(msg.from?.id, 'Надішліть коректне число')
        return false
      }
      await server.prepearingForPrinting(customBot, msg, newRequests[0], config);
      newRequests.shift();
      if(newRequests[0]){
        await askCopiesNumber(customBot, msg.from?.id, newRequests[0].message_id);
      }
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
  