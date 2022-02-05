const httpServer = require("http").createServer();
const options = {cors: {
    origin: [
        'http://localhost:3000', 
        'http://localhost:3001', 
        'http://localhost:3002',
        'http://localhost:3003',
        'https://zealous-payne-eadd60.netlify.app'
    ]
}};
const io = require("socket.io")(httpServer, options);

const PORT = process.env.PORT || 5000

// const { Server } = require("socket.io");
const setupForNewGame = require("./logics/setupForNewGame");
const updateNumberOfHands = require("./logics/updateNumberOfHands");


// const io = new Server(8080, {


//     // FOR DEV
//     // cors: {
//     //     origin: [
//     //         'http://localhost:3000', 
//     //         'http://localhost:3001', 
//     //         'http://localhost:3002',
//     //         'http://localhost:3003',
//     //         'http://localhost:3004',
//     //     ]
//     // }
// });

//create empty rooms
let rooms = [[]]

//create empty decks
let decks = [[]]

//store the current round player in each room
let currentRoundPlayer = [[]]

//store the currentBiggest cards and ranks(if 5-card case) in each room
let currentBiggests = [[]]
let currentBiggestRanks = [[]]

io.on("connection", (socket) => {
    
    //while client join a room, he joins the handmade room (the above array) and also the socket room
    socket.on('join', ({name, room}) => {           
        //push the new player to the correct room array if the room is not full:
        if (rooms[room].length < 4) {
            //loop over the room array to check if client is already in the room
            for(let i = 0; i < rooms[room].length; i++) {
                if(rooms[room][i].socketId === socket.id) return
            }
            socket.join(room)  

            //push player object to the room array
            rooms[room].push({
                socketId: socket.id,
                name,
                room,
                playerId: rooms[room].length,
                numberOfHands: 13,
                score: 0
            })
                                        
            //when < 4 players setWaiting in front end
            io.in(room).emit('waiting')

            //when the 4th player joins and fills a room
            if(rooms[room].length === 4) {
                //send room info to client
                io.in(room).emit('roomFilled', rooms[room])

                //assign individual playerId
                for(let i = 0; i < rooms[room].length; i++) {
                    io.to(rooms[room][i].socketId).emit('assignPlayerId', rooms[room][i].playerId)
                }                

                //setup a new game
                setupForNewGame(decks, room, rooms, io, currentRoundPlayer, currentBiggests, currentBiggestRanks)       
            }    
        } else {
            //send error message to client if the room is full
            io.to(socket.id).emit('full', `Room ${room + 1} is full!`)
            console.log('Room ', room + 1, ' is full')
        }       
        

        // io.on("disconnect", ({room}) => {
        //     console.log('disconnected!')     
        //     //update the rooms array by deleting disconnected player
        //     rooms[room] = rooms[room].filter(roomObj => roomObj.socketId !== socket.id)
        // })            

        //FOR DEV
        console.log('rooms', rooms)
        console.log('currentRoundPlayer', currentRoundPlayer)
    })       
    
    socket.on('play', cards => {
        const room = cards.rank ? cards.cards[0].room : cards[0].room

        //update the currentBiggests and currentBiggestRanks array on server
        if(cards.rank) {
            currentBiggests[room] = cards.cards
            currentBiggestRanks[room] = cards.rank
        } else {
            currentBiggests[room] = cards
            currentBiggestRanks[room] = []
        }

        //delete played cards in decks array
        const currentBiggestAllIndexes = []
        for (let i = 0; i < currentBiggests[room].length; i++) {
            currentBiggestAllIndexes.push(currentBiggests[room][i].allCardsIndex)
        }
        decks[room] = decks[room].filter(card => !currentBiggestAllIndexes.includes(card.allCardsIndex))

        //update number of hands prop in player object in room on server
        updateNumberOfHands(rooms, room, decks)

        //provide updated round info to all players for front end rendering
        io.in(room).emit('updateRound', {currentBiggest: currentBiggests[room], currentBiggestRank: currentBiggestRanks[room], players: rooms[room]})

        //let the next round player act
        currentRoundPlayer[room] = currentRoundPlayer[room] === 3 ? 0 : currentRoundPlayer[room] + 1
        io.to((rooms[room][currentRoundPlayer[room]]).socketId).emit('currentRound', false)               

        //FOR DEV
        console.log('currentRoundPlayer', currentRoundPlayer)        
    })

    socket.on('pass', hands => {
        const room = hands[0].room

        //define the next round player id
        currentRoundPlayer[room] = currentRoundPlayer[room] === 3 ? 0 : currentRoundPlayer[room] + 1

        //FOR DEV
        console.log('currentBiggests[room]', currentBiggests[room])
        console.log('currentBiggests[room][0]', currentBiggests[room][0])
        console.log('currentBiggests[room][0].owner', currentBiggests[room][0].owner)

        //check if passed by all other players
        const isPassedByAllOthers = currentBiggests[room][0].owner === rooms[room][currentRoundPlayer[room]].playerId
        
        //update the currentBiggest and currentBiggestRank info if all others passed
        if (isPassedByAllOthers) {
            currentBiggests[room] = []
            currentBiggestRanks = []
            io.in(room).emit('updateRound', {currentBiggest: currentBiggests[room], currentBiggestRank: currentBiggestRanks[room], players: rooms[room]})
        }
        
        //let the next round play act and pass the isPassedByAllOthers boolean to front end
        io.to(rooms[room][currentRoundPlayer[room]].socketId).emit('currentRound', isPassedByAllOthers)         

        //FOR DEV
        console.log('currentRoundPlayer', currentRoundPlayer)
    })

    socket.on('emptyHand', ({socketId, room}) => {
        //set isWinner state on front end of winner
        io.to(socketId).emit('win')        

        //calculate the scores and update players objects on server
        let winnerGainScore = 0;
        let winnerPlayerIndex = null;
        for (let i = 0; i < rooms[room].length; i++) {
            winnerGainScore += rooms[room][i].numberOfHands
            //deduct score of loser
            rooms[room][i].score -= rooms[room][i].numberOfHands
            //detect the winner
            if(rooms[room][i].numberOfHands === 0) winnerPlayerIndex = i 
        }
        rooms[room][winnerPlayerIndex].score += winnerGainScore

        //send waitForWinner events and updated players object to all clients
        io.in(room).emit('waitForWinner', rooms[room])

        //FOR DEV
        console.log(rooms[room])
    })

    socket.on('requireNewGame', room => {
        //setup a new game
        setupForNewGame(decks, room, rooms, io, currentRoundPlayer, currentBiggests, currentBiggestRanks)             
    })    


    //when client disconnect
    socket.on('disconnect', () => {
        //FOR DEV
        console.log(socket.id, ' disconnect!')

        io.to('0').emit('otherDisconnect')

        //clear room data
        rooms[0] = []

        
        // //searching for disconnected client's name and room
        // for (let i = 0; i < rooms.length; i++) {
        //     for (let j = 0; j < rooms[i].length; j++) {
        //         if (rooms[i][j].socketId === socket.id) {
        //             io.to(i).emit('otherDisconnect')
        //             //clear room data
        //             rooms[i] = []
        //             console.log('rooms[i]', rooms[i])
        //         }
        //     }
        // }
        
        
        // if(disconnectedClientRoom) {
        //     //send disconnect event to other players in the room
        //     io.in(disconnectedClientRoom).emit('otherDisconnect')
        //     //clear room data
        //     rooms[disconnectedClientRoom] = []
        // }                

        //FOR DEV
        //clear room data
        // console.log(rooms[disconnectedClientRoom])
    })


    //FOR DEV
    console.log(socket.id, ' is connected!')
});

httpServer.listen(PORT);