import {Number, String, Array, Record, Union, Static, Function, Undefined} from 'runtypes';

const Tbot = Record({
    sendTextMessage: Function,
    sendButtons: Function,
    sendDocument: Function,
    downloadFile: Function,
    sendChatAction: Function
});

const admin = Record({
    username: String,
    id: Number
});

const valid_files_conf = Record({
    valid_mime_types: String,
    valid_file_types: Array(String)
});

const config = Record({
    telegram_token: String,
    admin: admin,
    requests_bd_path: String,
    files_bd_path: String,
    primaryUsersList: Array(String),
    valid_files_conf: valid_files_conf
});

const req = Record({
    user_id: Union(Number, Undefined),
    file_id: Union(String, Undefined),
    username: Union(String),
    button_id: Number,
    copiesNumber: Number,
    filePath: String
});

const requests = Array(req);

const additionalParams = Record({
    copiesNumber: Number,
    button_id: Number,
    filePath: String
});

const newRequest = Record({
    user_id: Number,
    message_id: Number,
    file_id: String
});

const newRequests = Array(newRequest);


type Tbot = Static<typeof Tbot>;
type Admin = Static<typeof admin>;
type Valid_files_conf= Static<typeof valid_files_conf>;
type Config = Static<typeof config>;
type Req = Static<typeof req>;
type Requests = Static<typeof requests>;
type AdditionalParams = Static<typeof additionalParams>
type NewRequests = Static<typeof newRequests>;
type NewRequest = Static<typeof newRequest>;

export {Tbot, Config, Req, Valid_files_conf, Admin, Requests, AdditionalParams, NewRequests, NewRequest}