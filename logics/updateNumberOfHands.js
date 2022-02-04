module.exports = function updatedNumberOfHands(rooms, room, decks) {
    for (let i = 0; i < rooms[room].length; i++) {
        let updatedNumberOfHands = 0;
        for (let j = 0; j < decks[room].length; j++) {
            if(decks[room][j].owner === rooms[room][i].playerId) {
                updatedNumberOfHands++
            }
        }
        rooms[room][i] = {
            ...rooms[room][i],
            numberOfHands: updatedNumberOfHands
        }            
    }
}