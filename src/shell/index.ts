const { exec } = require("child_process");
const printFile = (filePath: string, copiesNum: number) => {
    if(copiesNum == 1){
        var command = 'lp ' + filePath;
    }else{
        var command = 'lp -n ' + copiesNum + ' ' + filePath;
    }

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