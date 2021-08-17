import { Tbot } from '../types/Tbot';
import TelegramBot from 'node-telegram-bot-api';
import * as fs from 'fs';
import shell from '../shell';
import { request } from 'express';

const checkForAdmin = (username: string|number|undefined, admin_username: string) => {
    if(admin_username == username){
        return true
    }else{
        return false
    }
};



//----------- work with bd ------------//

const setParamsToBd = (requests: any, req: any, arr: any, path: string) => {
    try {
        req.copiesNumber = arr.copiesNumber;
        req.button_id = arr.button_id;
        req.filePath = arr.filePath;
        fs.writeFile(path, JSON.stringify(requests), function (err) {
            //console.log(err);
        });
    } catch (error) {
        console.log(error);
    }
    //return user
}

const writeToBd = async (msg : TelegramBot.Message, config: any) => {
    const req = {
        "user_id": msg.from?.id,
        "file_id": msg.document?.file_id,
        "username": msg.from?.username,
        "copiesNumber": 0,
        "filePath": 0
    };
        //const data = fs.readFileSync(config.users_bd_path);
        //var requests = getRequestsFromBd(config.users_bd_path);
        fs.readFile(config.users_bd_path, 'utf8', function(err, contents) {
            console.log(contents);
            // fs.writeFile(config.users_bd_path, JSON.stringify(JSON.parse(contents).push(req)), function (err) {
            //     console.log('writted to bd');
            // });
            var content = JSON.parse(contents);
            content.push(req);
            contents = JSON.stringify(content);
            //fs.writeFileSync(config.users_bd_path, content);
            fs.writeFile(config.users_bd_path, contents, function (err) {
                console.log('writted to bd');
            });
        });
        // requests.push(req); 
        // requests = JSON.stringify(requests);
       
}

const getRequestsFromBd = (path: string) => {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
    //return requests
}

const checkIfSomeReqWithNoCopiesNum = (userId: number | undefined, path: string) => {
    const requests = getRequestsFromBd(path);
    if(requests.filter((x:any) => x.user_id === userId && x.copiesNumber === 0).length > 1){
        console.log('checkIfSomeReqWithNoCopiesNum: there are few elements in bd with zero nums of copies');
        return true
    };
    return false;
}



//----------- telegram API -----------//

const askAdmin = async (bot: Tbot, req: any, admin: any, copiesNumber: number) => {
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

const sendAnswer = async (bot: Tbot, req:any, result: boolean) => {
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


const findReqInBdByBtnId = (requests: any, id: number | undefined) => {
    return requests.find((x:any) => x.button_id === id);
}

const findReqInBdByFileId = (requests: any, id: number | undefined) => {
    try{
        console.log('hello');
        return requests.find((x:any) => x.file_id === id && x.copiesNumber === 0);
    }catch(error){
        console.log(error);
    }
}
 
const printFile = (filePath: string, copiesNum: number) => {
    const resuslt = shell.printFile(filePath, copiesNum);
    //console.log(resuslt);
};

const checkUserInPrimaryList = (username: string, userslist: string[]) => {
    return userslist.some((x:any) => x === username)
};

// when user set copies' number
async function prepearingForPrinting(bot: Tbot, msg: TelegramBot.Message, element:any ,config: any): Promise<unknown> {
   // console.log(element);
    const requests = getRequestsFromBd(config.users_bd_path);
    const req = findReqInBdByFileId(requests, element.file_id);
    console.log(req);
    console.log(requests);
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
    const arr = {
        copiesNumber: Number(msg.text),
        filePath: path,
        button_id: 0
    }
    //setParamsToBd(requests, req, arr, config.users_bd_path);

    if(checkUserInPrimaryList(req.username, config.primaryUsersList)){  // if user already in primaryList he musn't wait for allowation
        console.log(req.username + ' is in primary list');
        await sendAnswer(bot, req, true);
        printFile(arr.filePath, arr.copiesNumber); // bot can start printing
    }else{
        const buttonId = await askAdmin(bot, req, config.admin, arr.copiesNumber);
        if(buttonId){
            console.log('admin ' + config.admin.username + ' has been asked');
            await bot.sendTextMessage(req.user_id, 'Запит було надіслано, очікуйте..');
            arr.button_id = buttonId.message_id;
        }
    }
    setParamsToBd(requests, req, arr, config.users_bd_path);
    console.log('prepearingForPrinting: finished');
    return true
};


//  when admin press the button
async function queryProccess(bot: Tbot, msg: TelegramBot.CallbackQuery, config: any): Promise<unknown> {
    const requests = getRequestsFromBd(config.users_bd_path);
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
    return false
}

export default {
    queryProccess,
    writeToBd,
    prepearingForPrinting,
    checkIfSomeReqWithNoCopiesNum
  };