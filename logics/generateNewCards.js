module.exports = function generateNewCards(room) {
  let deck = []   
  let reshuffle = false  

  do{
    deck = []    
    reshuffle = false

    for (let i = 0; i < 52; i++) {
      let suit;
      let number;
      //decide suit and number
      if (i < 13) {
        suit = 0;
        number = i + 3;
      } else if (i < 26) {
        suit = 1;
        number = i + 3 - 13;
      } else if (i < 39) {
        suit = 2;
        number = i + 3 - 13 * 2;
      } else {
        suit = 3;
        number = i + 3 - 13 * 3;
      }
      //push a card object to deck
      deck.push({
        suit,
        number,
        selected: false,
        room
      })
    }
    
    //shuffle cards
    for (let i = deck.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    //distribute cards
    for (let i = 0; i < deck.length; i++) {
      deck[i]['allCardsIndex'] = i;
      if (i < 13) {
        deck[i]['owner'] = 0
      } else if (i < 26) {
        deck[i]['owner'] = 1
      } else if (i < 39) {
        deck[i]['owner'] = 2
      } else {
        deck[i]['owner'] = 3
      }
    }

    //check if anyone's hands contain fewer than 2 cards bigger than '10' and no 'A' or '2', reshuffle if true
    for (let i = 0; i < 4; i++) {
      //check for 'A' and '2'
      let AOr2 = deck.filter(card => card.owner === i && card.number > 13)      
      if (AOr2.length > 0) continue

      //check for number of cards bigger than '10'
      let cardsBiggerThan10 = deck.filter(card => card.owner === i && card.number > 10)
      if (cardsBiggerThan10.length < 3) {
        reshuffle = true
      }      
    }
  }
  
  while (reshuffle === true)

  return deck
}        
    
    




// // //dealing cards to players individually
// for(let i = 0; i < rooms[room].length; i++){
//   let startingHand = decks[room].filter(card => card.owner === rooms[room][i].playerId)
//   for(let j = 0; j < startingHand.length; j++) {
//       startingHand[j]['myCardsIndex'] = j
//   }
//   io.to(rooms[room][i].socketId).emit('dealingCards', startingHand)
// }