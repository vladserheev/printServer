import { Tbot } from '../types/Tbot';
import TelegramBot from 'node-telegram-bot-api';
import * as fs from 'fs';
import shell from '../shell';
import { Server } from 'http';


const checkForAdmin = (username: string|number|undefined, admin_username: string) => {
    if(admin_username == username){
        return true
    }else{
        return false
    }
};

const writeToBd = (msg : TelegramBot.Message, config: any) => {
    const user = {
        "message_id": 0,
        "user_id": msg.from?.id,
        "file_id": msg.document?.file_id,
        "username": msg.from?.username,
        "copiesNumber": 0,
        "filePath": 0
    };
    fs.readFile(config.users_bd_path, 'UTF-8', (err, data: string) => {
        if (err) throw err;
        var student = JSON.parse(data);
        student.push(user); 
        student = JSON.stringify(student);
        fs.writeFile(config.users_bd_path, student, function (err) {
            //console.log(err);
        });
    });
}

const askAdmin = async (bot: Tbot, req: any, admin: any, copiesNumber: number) => {
    ///console.log(msg);
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
        console.log(error)
    }
}

const sendAnswer = (bot: Tbot, req:any, result: boolean) => {
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

const getRequestsFromBd = (path: string) => {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
    //return requests
}

const findReqInBdByMsgId = (requests: any, id: number | undefined) => {
    return requests.find((x:any) => x.message_id === id);
}

const findReqInBdByUserId = (requests: any, id: number | undefined) => {
    try{
    return requests.find((x:any) => x.user_id === id && x.copiesNumber === 0);
    }catch(error){
        console.log(error);
    }
}
 
// const changeReqStatus = (req: Object, status: boolean) => {

// }

const setParamsToBd = (requests: any, req: any, arr: any, path: string) => {
    try {
        req.copiesNumber = arr.copiesNumber;
        req.message_id = arr.messageId;
        req.filePath = arr.filePath;
        fs.writeFile(path, JSON.stringify(requests), function (err) {
            //console.log(err);
        });
    } catch (error) {
        console.log(error);
    }
    //return user
}

const printFile = (filePath: string, copiesNum: number) => {
    const resuslt = shell.printFile(filePath, copiesNum);
    console.log(resuslt);
};



async function prepearingForPrinting(bot: Tbot, msg: TelegramBot.Message, config: any): Promise<unknown> {
    const requests = getRequestsFromBd(config.users_bd_path);
    const req = findReqInBdByUserId(requests, msg.from?.id);
    console.log(req.username + " set the copies' number");
    const path = await bot.downloadFile(req.file_id, config.files_bd_path);
    if(!path){
        console.log('failed to download the file');
        return false
    }
    if(!req){
        console.log('findReqInBdByUserId: smth went wrong, user_id: ' + msg.from?.id);
        return false
    }

    const result = await askAdmin(bot, req, config.admin, Number(msg.text));
    const arr = {
        copiesNumber: Number(msg.text),
        messageId: result.message_id,
        filePath: path
    }
    setParamsToBd(requests, req, arr, config.users_bd_path);
    if(result){
        console.log('admin ' + config.admin.username + ' has been asked');
        bot.sendTextMessage(req.user_id, 'Запит було надіслано, очікуйте..')
    }
    return true
};

function queryProccess(bot: Tbot, msg: TelegramBot.CallbackQuery, config: any) {
    const requests = getRequestsFromBd(config.users_bd_path);
    const req = findReqInBdByMsgId(requests, msg.message?.message_id);
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
        sendAnswer(bot, req, true);
        printFile(req.filePath, req.copiesNumber);
    }else{
        console.log('admin refused!');
        sendAnswer(bot, req, false);
    }
}

export default {
    queryProccess,
    writeToBd,
    prepearingForPrinting
  };