import TelegramBot from 'node-telegram-bot-api';
import * as fs from 'fs';
import shell from '../shell';
import { Config, Tbot, Req, Valid_files_conf, Admin, Requests, AdditionalParams, NewRequest} from '../types';

const checkValidFile = (file: TelegramBot.Document, config: Valid_files_conf): boolean => {
    const fileType = file.file_name?.split('.').pop();
    console.log(config);
    if(file.mime_type === config.valid_mime_types){
        return true
    }else if(config.valid_file_types.some((x:string) => x === fileType)){
        return true
    }
    return false
}

const checkVslidNumber = (number: number): boolean => {
    if(number >= 20 || number < 1 || !Number.isInteger(number)){
        return false
    }
    return true
}

const checkForAdmin = (username: string|number|undefined, admin_username: string): boolean => {
    if(admin_username == username){
        return true
    }else{
        return false
    }
};

//----------- work with bd ------------//

const setParamsToBd = (requests: Requests, req: Req, arr: AdditionalParams, path: string) => {
    try {
        req.copiesNumber = arr.copiesNumber;
        req.button_id = arr.button_id;
        req.filePath = arr.filePath;
        fs.writeFile(path, JSON.stringify(requests), function (err) {
            console.log('setParamsToBd: ' + req.username + ' was updated with new params');
        });
    } catch (error) {
        console.log(error);
    }
    //return user
}

const writeToBd = async (msg : TelegramBot.Message, config: Config) => {
    const req:Req = {
        "user_id": msg.from?.id,
        "file_id": msg.document?.file_id,
        "username": msg.from?.username || '',
        "copiesNumber": 0,
        "filePath": '',
        "button_id": 0
    };
    var requests = getRequestsFromBd(config.requests_bd_path);
    requests.push(req);
    fs.writeFileSync(config.requests_bd_path, JSON.stringify(requests));
}

const getRequestsFromBd = (path: string):Requests => {
    return JSON.parse(fs.readFileSync(path, {encoding:'utf8', flag:'r'}));
}

const removeItemFromBd = (requests: Requests, req: Req, path: string) => {
    const index = requests.indexOf(req);
    console.log(index);
    if (index > -1) {
        requests.splice(index, 1);
    }
    fs.writeFile(path, JSON.stringify(requests), (err) => {
        if(!err){
            console.log('removeUserDataAfterPrinting: req deleted successfully');
        }
    });
}

const removeFile = (filePath: string) => {
    fs.unlink(filePath, function(err){
        if(err) return console.log(err);
        console.log('removeUserDataAfterPrinting: file deleted successfully');
   });  
}

const removeUserDataAfterPrinting = (requests: Requests, req: Req, filePath:string, config: Config) => {
    removeItemFromBd(requests, req, config.requests_bd_path);
    removeFile(filePath);
}

//----------- telegram API -----------//

const askAdmin = async (bot: Tbot, req: Req, admin: Admin, copiesNumber: number): Promise<TelegramBot.Message> => {
    try {
        const username = req.username;
        const caption = {"caption": username + ' хоче роздркувати ці файли \nКількість копій: ' + copiesNumber};
        const document_file_id = req.file_id;
        const opts = {
            "reply_markup": {
                "inline_keyboard": [
                [{
                    "text": "Так"
                    ,"callback_data": "allow"            
                }, 
                {
                    "text": "Відмовити"
                    ,"callback_data": "refuse"            
                }]
                ]
            }
        };

        await bot.sendDocument(admin.id, document_file_id, caption);
        return await bot.sendButtons(admin.id, 'Дозволити?', opts);
    } catch (error) {
        return error;
        
        console.log(error)
    }
}

const sendAnswer = async (bot: Tbot, req:Req, result: boolean) => {
    try {
        var text: string;
        if(result){
            text = 'Дозвіл отримано, очікуйте на друк';
        }else{
            text = 'Відхилено';
        }

        bot.sendTextMessage(req.user_id, text);
    } catch (error) {
        console.log(error);
    }
}


const findReqInBdByBtnId = (requests: Requests, id: number | undefined):Req | undefined => {
    try {
        return requests.find((x:Req) => x.button_id === id);
    } catch (error) {
        console.log(error);
        return error
    }
}

const findReqInBdByFileId = (requests: Requests, id: string):Req | undefined => {
    try{
        return requests.find((x:Req) => x.file_id === id && x.copiesNumber === 0);
    }catch(error){
        console.log(error);
    }
}
 
const printFile = (filePath: string, copiesNum: number) => {
    const resuslt = shell.printFile(filePath, copiesNum);
};

const checkUserInPrimaryList = (username: string, userslist: string[]):boolean => {
    return userslist.some((x:string) => x === username)
};

// when user set copies' number
async function prepearingForPrinting(bot: Tbot, msg: TelegramBot.Message, element:NewRequest, config: Config): Promise<boolean> {
    const requests = getRequestsFromBd(config.requests_bd_path);
    const req = findReqInBdByFileId(requests, element.file_id);

    if(!req){
        console.log('findReqInBdByFileId: smth went wrong, user_id: ' + msg.from?.id);
        return false
    }
    const path = await bot.downloadFile(req.file_id, config.files_bd_path);
    if(!path){
        console.log('failed to download the file');
        return false
    }
    console.log(req.username + " set the copies' number: " + msg.text);
    const additionalParamsToReq = {
        copiesNumber: Number(msg.text),
        filePath: path,
        button_id: 0
    }

    if(checkUserInPrimaryList(req.username, config.primaryUsersList)){  // if user in primaryList he musn't wait for allowation
        console.log(req.username + ' is in primary list');
        await sendAnswer(bot, req, true);
        printFile(additionalParamsToReq.filePath, additionalParamsToReq.copiesNumber); // bot can start printing
    }else{
        const result = await askAdmin(bot, req, config.admin, additionalParamsToReq.copiesNumber);
        if(result){
            console.log('admin ' + config.admin.username + ' has been asked');
            await bot.sendTextMessage(req.user_id, 'Запит було надіслано, очікуйте..');
            additionalParamsToReq.button_id = result.message_id; // it helps connect user's file and the button that is sent to the admin
        }
    }
    setParamsToBd(requests, req, additionalParamsToReq, config.requests_bd_path);
    console.log('prepearingForPrinting: finished');
    return true
};


//  when admin press the button
async function queryProccess(bot: Tbot, msg: TelegramBot.CallbackQuery, config: Config): Promise<boolean> {
    const requests = getRequestsFromBd(config.requests_bd_path);
    const req = findReqInBdByBtnId(requests, msg.message?.message_id);
    if(!req){
        console.log('findReqInBdByMsgId: user ' + msg.from?.username +' has not been find');
        return false
    }
    if(!checkForAdmin(msg.from.username, config.admin.username)){
        console.log('it is no an admin');
        return false
    }


    if(msg.data == 'allow'){
        console.log('admin alowed!');
        await sendAnswer(bot, req, true);
        printFile(req.filePath, req.copiesNumber);

    }else{
        console.log('admin refused!');
        await sendAnswer(bot, req, false);
    }
    removeUserDataAfterPrinting(requests, req, req.filePath, config);
    return false
}

export default {
    queryProccess,
    writeToBd,
    prepearingForPrinting,
    checkVslidNumber,
    checkValidFile
  };