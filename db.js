var mysql = require('mysql');

function connectDB() {
    var connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        database : 'sklepzgrami'
      });
    return new Promise((resolve, reject) => {
        connection.connect(function(err) {
            if (err) {
              console.error('error connecting: ' + err.stack);
              reject(err);
            }
            resolve(connection);
        });
    }); 
}

function execute(query) {
    return connectDB().then((connection)=>{
        return new Promise((resolve, reject) => {
            connection.query(query, function (error, results, fields) {
                if (error) reject(error);
                resolve(results, fields);
            });
        });
    })
    
}

function getPlanszowe(){
    return execute(`CALL getPlanszowe()`);
}

function getKarciane(){
    return execute(`CALL getKarciane()`);
}

function getFigurkowe(){
    return execute(`CALL getFigurkowe()`);
}

function getGame(id){
    return execute(`CALL getGame('${id}')`)
}

function registerClients(name, lastName, email, password, phone_number, adress){
    return execute(`CALL registerClients('${name}', '${lastName}', '${email}', '${password}', '${phone_number}', '${adress}')`)
}

function loginClient(login, password){
    return execute(`CALL loginClient('${login}', '${password}')`)
}

function getCard(userId){
    return execute(`CALL getCard('${userId}')`)
  }
  
  function addGametoCard(userId, productId){
    return execute(`CALL addGametoCard('${userId}',  '${productId}')`)
  }
  
  function removeCard(id){
    return execute(`CALL removeCard('${id}')`)
  }
  
  function removeCardByGame(gameId){
    return execute(`CALL removeCardByGame('${gameId}')`)
  }
  


module.exports = {
    getPlanszowe,
    getKarciane,
    getFigurkowe,
    getGame,
    loginClient,
    registerClients,
    getCard,
    addGametoCard,
    removeCard,
    removeCardByGame
};