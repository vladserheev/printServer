const { exec } = require("child_process");
const printFile = (filePath: string, copiesNum: number) => {
    console.log('printing....');
    if(copiesNum == 1){
        var command = 'lp ' + filePath;
    }else{
        var command = 'lp -n ' + copiesNum + ' ' + filePath;
    }

    exec(command, (error:any, stdout:any, stderr:any) => {
        if (error) {
            console.log(`error: ${error}`);
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