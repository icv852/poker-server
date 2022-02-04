const generateNewCards = require('./generateNewCards')
const findDiamond3Owner = require('./findDiamond3Owner')
const updateNumberOfHands = require('./updateNumberOfHands')

module.exports = function setupForNewGame(decks, room, rooms, io, currentRoundPlayer, currentBiggests, currentBiggestRanks) {
    //clear the currentBiggest and currentBiggestRanks array of the room on server
    currentBiggests[room] = []
    currentBiggestRanks[room] = []

    //send an event to front ends to clear all old in game states
    io.in(room).emit('clearOldStates')

    //generate a new deck for the room
    decks[room] = generateNewCards(room)

    //dealing cards to players individually
    for(let i = 0; i < rooms[room].length; i++){
        let startingHand = decks[room].filter(card => card.owner === rooms[room][i].playerId)
        for(let j = 0; j < startingHand.length; j++) {
            startingHand[j]['myCardsIndex'] = j
        }
        io.to(rooms[room][i].socketId).emit('dealingCards', startingHand)
    }

    //update number of hands prop in player object in room on server
    updateNumberOfHands(rooms, room, decks)

    //provide updated round info to all players for front end rendering
    io.in(room).emit('updateRound', {currentBiggest: currentBiggests[room], currentBiggestRank: currentBiggestRanks[room], players: rooms[room]})

    //let the first round player act
    currentRoundPlayer[room] = findDiamond3Owner(decks[room])
    io.to(rooms[room][currentRoundPlayer[room]].socketId).emit('firstRound')
    io.to(rooms[room][currentRoundPlayer[room]].socketId).emit('currentRound', false)
}