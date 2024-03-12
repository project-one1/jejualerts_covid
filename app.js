const express = require('express');
const request = require('request');
var parser = require('xml2json');
var fs = require('fs');
require("ejs");
var app = express();
const bodyParser = require('body-parser');
var cron = require('node-cron');
const fetch = require('node-fetch');
const dJSON = require('dirty-json');


//Database
const mongoose = require('mongoose');
var db1 = mongoose.createConnection('databaselink', {useNewUrlParser: true, useUnifiedTopology: true});
var db2 = mongoose.createConnection('databaselink', {useNewUrlParser: true, useUnifiedTopology: true});
var db3 = mongoose.createConnection('databaselink', {useNewUrlParser: true, useUnifiedTopology: true});

var os = require('os');
require('dotenv/config');
var cors = require('cors');
const { RSA_SSLV23_PADDING } = require('constants');
//Naver and Emergency Message Calling 

var client_id = 'p5xDQ4rMIk1SPNl1fkPd';
var client_secret = '0msxJoXWGb';
let query = 'msg';

var url = 'http://apis.data.go.kr/1741000/DisasterMsg2/getDisasterMsgList'; //API LINK
var queryParams2 = '?' + encodeURIComponent('ServiceKey') + 'APIKEY'; /* Service Key*/
queryParams2 += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1'); /* */
queryParams2 += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('1000'); /* */
queryParams2 += '&' + encodeURIComponent('type') + '=' + encodeURIComponent('json'); /* */
queryParams2 += '&' + encodeURIComponent('flag') + '=' + encodeURIComponent('Y'); /* */


// Variable for User Info
let ts = Date.now();
let date_ob = new Date(ts);
let date = date_ob.getDate();
let month = (date_ob.getMonth() + 1).toString().padStart(2, "0");
let year = date_ob.getFullYear();
let hour = date_ob.getHours();
let minute = date_ob.getMinutes();
let seconds = date_ob.getSeconds();
var opsys = process.platform;
let enddate = (year, month, date);
var covidNumberUrl = 'http://openapi.data.go.kr/openapi/service/rest/Covid19/getCovid19InfStateJson'; //API LINK
var jejuNumberUrl = 'http://openapi.data.go.kr/openapi/service/rest/Covid19/getCovid19SidoInfStateJson'; //API Link
var queryParams = '?' + encodeURIComponent('ServiceKey') + 'APIKEY'; /* Service Key*/
queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1'); /* */
queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('100'); /* */
queryParams += '&' + encodeURIComponent('startCreateDt') + '=' + encodeURIComponent('20201221'); /* */
queryParams += '&' + encodeURIComponent('endCreateDt') + '=' + encodeURIComponent('enddate'); /* */
var jejuParams = '?' + encodeURIComponent('ServiceKey') + 'APIKEY'; /* Service Key*/
jejuParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1'); /* */
jejuParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('100'); /* */
jejuParams += '&' + encodeURIComponent('startCreateDt') + '=' + encodeURIComponent('20210118');
jejuParams += '&' + encodeURIComponent('endCreateDt') + '=' + encodeURIComponent('enddate');

//Section 
function userInfo(){
   console.log("User connected: ")
   console.log("  Time: " + year + "-" + month + "-" + date + " " + hour + "h " + minute+"m " + seconds + "s");
   console.log("  OS Version: "+os.release()); // "10.0.14393"
   if (opsys == "darwin") {
    opsys = "MacOS";
   } else if (opsys == "win32" || opsys == "win64") {
    opsys = "Windows";  
   } else if (opsys == "linux") {
    opsys = "Linux";
   }
   console.log("  OS: "+opsys)
   fetch('https://api.ipify.org/?format=json')
   .then(results => results.json())
   .then(data =>  console.log("  Ip Address: "+data.ip))
}
app.set("view engine", "ejs"); 
app.use(express.static(__dirname + '/views'));
app.use(bodyParser.urlencoded({ extended: false })); 



//Database 1 Set-up
var covidSchema = new mongoose.Schema({
   Confirmed: Number,
   Death: Number,
   Recovered: Number,
   Date: Number
 });
 var covidDB = db1.model("datas", covidSchema);
 
 //Database 2 Set-up
var messageSchema = new mongoose.Schema({
   Location: String,
   Message: String,
   Date: String
 });
 var messageDB = db2.model("datas2", messageSchema);
 
 //Database 3 Set-up
var jejuSchema = new mongoose.Schema({
   Confirmed: Number,
   Death: Number,
   Recovered: Number,
   Date: Number
 });
 var jejuDB = db3.model("datas", jejuSchema);
 //Jeju DataSet

 cron.schedule('40 12 * * *', () => {
   request({
      url: jejuNumberUrl + jejuParams,
      method: 'GET'
   }, function (error, response, body) {
   var json = JSON.parse(parser.toJson(body, {reversible: true}));
//console.log(json.response.body.items.item[1].defCnt.$t);
   
   const jejuDBs = new jejuDB ({
      
      Confirmed: json.response.body.items.item[1].defCnt.$t, 
      Death: json.response.body.items.item[1].deathCnt.$t, 
      Recovered: json.response.body.items.item[1].isolClearCnt.$t, 
      Date: year+""+month+""+date
   })
   .save(function(err, result) {
      if (err) throw err;
   })
   });
 });


 

  


//Korea DataSet
   request({
      url: covidNumberUrl + queryParams,
      method: 'GET'
   }, function (error, response, body) {
   var json = JSON.parse(parser.toJson(body, {reversible: true}));
   const covidDBs = new covidDB ({
      Confirmed: json.response.body.items.item[0].decideCnt.$t, 
      Death: json.response.body.items.item[0].deathCnt.$t, 
      Recovered:  json.response.body.items.item[0].clearCnt.$t, 
      Date: year+""+month+""+date
   })
   .save(function(err, result) {
      if (err) throw err;
   })
   });

app.get('/', function(req, res) {
   console.log(date);
/*
request({
      url: url + queryParams2,
      method: 'GET'
  }, function (error, response, body) {
      //console.log('Status', response.statusCode);
      //console.log('Headers', JSON.stringify(response.headers));
      const data = JSON.parse(body)
      const dataDetails = data.DisasterMsg[1]['row']
      dataDetails.forEach(element =>{
          if (element['location_name'] == "제주특별자치도 전체"){
              //console.log(element['msg']+" | "+element['create_date'])
              query = element['msg']
              var api_url = 'https://openapi.naver.com/v1/papago/n2mt';
              var options = {
                  url: api_url,
                  form: {'source':'ko', 'target':'en', 'text':query},
                  headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret}
               };
              request.post(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                  
                  res.end(body);
                  var r = dJSON.parse(body)
                  console.log(r.message.result.translatedText);

                  const messageDBs = new messageDB ({
                     Location: element['location_name'],
                     Message: r.message.result.translatedText,
                     Date: element['create_date'],
                  })
                  .save(function(err, result) {
                     if (err) throw err;
                  })
                } else {
                  res.status(response.statusCode).end();
                  console.log('error = ' + response.statusCode);
                }
              });
          }
      });
    
  });
*/
 
  
     covidDB.find()
      .then(function(data){
         var currentNumber = data.length - 1
         var beforeNumber = data.length -2
         var confirmedNumber = [data[currentNumber].Confirmed]
         var recoveredNumber = [data[currentNumber].Recovered]
         var deathNumber = [data[currentNumber].Death]
         var updatedDate = [data[currentNumber].Date]
   
   //Comparsion Code
      var death1 = data[currentNumber].Death
      var death2 = data[beforeNumber].Death
         console.log(death2);
      var confirmed1 = data[currentNumber].Confirmed
      var confirmed2 = data[beforeNumber].Confirmed
   
      var recovered1 = data[currentNumber].Recovered
      var recovered2 = data[beforeNumber].Recovered
   
      var death_increase = [(death_increase<=0?"":"+") +[death1 - death2]]
      var confirmed_increase = [(confirmed_increase<=0?"":"+") +[confirmed1 - confirmed2]]
      var recovered_increase = [(recovered_increase<=0?"":"+")+[recovered1 - recovered2]]
   
      console.log(death_increase);
      confirmedNumber.push(confirmedNumber);
      recoveredNumber.push(recoveredNumber);
      deathNumber.push(deathNumber);
      updatedDate.push(updatedDate);
      death_increase.push(death_increase);
      confirmed_increase.push(confirmed_increase);
      recovered_increase.push(recovered_increase);
      jejuDB.find()
         .then(function(data2){
            var jejucurrentNumber = data2.length - 1;
            var jejubeforeNumber = data2.length -2;
            var jejuconfirmedNumber = [data2[jejucurrentNumber].Confirmed];
            var jejurecoveredNumber = [data2[jejucurrentNumber].Recovered];
            var jejudeathNumber = [data2[jejucurrentNumber].Death];
            var jejuupdatedDate = [data2[jejucurrentNumber].Date];
      
      //Comparsion Code
         var jejudeath1 = data2[jejucurrentNumber].Death;
         var jejudeath2 = data2[jejubeforeNumber].Death;
         var jejuconfirmed1 = data2[jejucurrentNumber].Confirmed;
         var jejuconfirmed2 = data2[jejubeforeNumber].Confirmed;
      
         var jejurecovered1 = data2[jejucurrentNumber].Recovered;
         var jejurecovered2 = data2[jejubeforeNumber].Recovered;
      
         var jejudeath_increase = [(jejudeath_increase<=0?"":"+") +[jejudeath1 - jejudeath2]];
         var jejuconfirmed_increase = [(jejuconfirmed_increase<=0?"":"+") +[jejuconfirmed1 - jejuconfirmed2]];
         var jejurecovered_increase = [(jejurecovered_increase<=0?"":"+")+[jejurecovered1 - jejurecovered2]];
      
         console.log(jejudeath_increase);
         jejuconfirmedNumber.push(jejuconfirmedNumber);
         jejurecoveredNumber.push(jejurecoveredNumber);
         jejudeathNumber.push(jejudeathNumber);
         jejuupdatedDate.push(jejuupdatedDate);
         jejudeath_increase.push(jejudeath_increase);
         jejuconfirmed_increase.push(jejuconfirmed_increase);
         jejurecovered_increase.push(jejurecovered_increase);
         
           
      res.render('index', { jejuconfirmedNumber,jejurecoveredNumber, jejudeathNumber,jejudeath_increase,jejuconfirmed_increase,jejurecovered_increase,confirmedNumber, recoveredNumber, deathNumber, updatedDate, recovered_increase, confirmed_increase, death_increase}); //, death_increase, recovered_increase, confirmed_increase 
   })
      })
});
      //console.log('Status', response.statusCode);
      //console.log('Headers', JSON.stringify(response.headers));
      //console.log('Reponse received', body);

         
        

     
    
    
/*
    //Comparsion Code
    var death1 = JSON.parse(json.response.body.items.item[0].deathCnt.$t)
    var death2 = JSON.parse(json.response.body.items.item[1].deathCnt.$t)

    var confirmed1 = JSON.parse(json.response.body.items.item[0].decideCnt.$t)
    var confirmed2 = JSON.parse(json.response.body.items.item[1].decideCnt.$t)

    var recovered1 = JSON.parse(json.response.body.items.item[0].clearCnt.$t)
    var recovered2 = JSON.parse(json.response.body.items.item[1].clearCnt.$t)

    var death_increase = [(death_increase<=0?"":"+") +[death1 - death2] ]
    var confirmed_increase = [(confirmed_increase<=0?"":"+") +[confirmed1 - confirmed2]]
    var recovered_increase  = [(recovered_increase<=0?"":"+")+[recovered1 - recovered2]]
 */
console.log('Express listening on port 8080');
   //Logging user data to the console
  userInfo()
app.listen(process.env.PORT || 3000);