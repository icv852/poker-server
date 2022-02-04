module.exports = function findDiamond3Owner(deck) {
    return diamond3Owner = deck.filter(card => (card.suit === 0 && card.number === 3))[0].owner    
}


