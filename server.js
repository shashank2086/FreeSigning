var express = require('express')
  , bodyParser = require('body-parser');
const { exec } = require("child_process");
var app = express();
var code = "";
const shortid = require("shortid");
const fsPromises = require("fs").promises;
const { stdout, stderr } = require('process');

app.use(bodyParser.json());
app.post('/getipa', async function(request, response){
  unique_id = shortid.generate();
  dir_path = __dirname + "/uploads/User_" + unique_id;
  simplifyWDA = dir_path + "/new_agent.ipa";
  if(request.body.code != undefined){
    code=request.body.code;
  }else{
    code="";
  }
  if(request.body.email==null || request.body.password==null || request.body.name==null || request.body.udid==null){
    response.send({"error":"Invalid Data"});
  }else{
    try{
      await fsPromises.mkdir(dir_path);
      exec("cp cook new_agent.ipa uploads/User_"+unique_id,(error,stdout,stderr) => {
        if (error) {
          return response.status(400).send({"error":error});
        }
        if (stderr) {
          return response.status(400).send({"error":stderr});
        }
         exec(
      "./uploads/User_"+unique_id+"/cook register_device --appleId "+"'"+request.body.email+"'"+" --password "+"'"+request.body.password+"'"+" --2fa-code "+"'"+code+"'"+" --name "+"'"+request.body.name+"'"+" --udid "+"'"+request.body.udid+"'",
      (error, stdout, stderr) => {
        if(stdout){
          if(stdout.includes("Incorrect Apple ID or password")){
            response.status(400).send({"error":"Incorrect password"});
          }else if(stdout.includes("Your account information was entered incorrectly")){
            response.status(400).send({"error":"Incorrect Email"})
          }else if(stdout.includes("This device's UDID is invalid")){
            response.status(400).send({"error":"Invalid UDID"});
          }else if(stdout.includes("malformed2FACode")){
            response.status(400).send({"error":"Enter the verification code"});
          }else if(stdout.includes("Incorrect verification code")){
            response.status(400).send({"error":"Incorrect verification code"});
          }
          else{
            if(stdout.includes("Device registered successfully") || stdout.includes("Device is already registered")){
              exec(
                "./uploads/User_"+unique_id+"/cook resign --appleId "+"'"+request.body.email+"'"+" --password "+"'"+request.body.password+"'"+" --ipa ./uploads/User_"+unique_id+"/new_agent.ipa -f",
                (error, stdout, stderr) => {
                  if(stdout){
                    if(stdout.includes("App resigned successfully")){
                      response.download(simplifyWDA);
                    }else{
                      response.status(400).send({"error":stdout});
                    }
                  }
                });

            }else{
              response.status(400).send({"error":stdout})
            }
            
          }
        }
        // setTimeout(() => {
        //   exec("rm -rf " + dir_path, (error, stdout, stderr) => {
        //     console.log(`stdout: ${stdout}`);
        //   });
        // }, 30);

      });

      });
  
  }catch(error){
    response.send({"error":error});
  }
}

});



var server = app.listen(9000, function () {  
  var host = server.address().address  
  var port = server.address().port  
})  
