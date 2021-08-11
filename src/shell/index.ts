const { exec } = require("child_process");
const printFile = (filePath: string) => {
    let command = 'lp ' + filePath;
    exec(command, (error:any, stdout:any, stderr:any) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}

export default {
    printFile
}