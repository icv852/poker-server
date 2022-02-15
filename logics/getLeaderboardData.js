module.exports = async function getLeaderboardData(dbRef, child, get) {    
    const data = await get(child(dbRef, `leaderboard`)).then((snapshot) => { 
        if (snapshot.exists()) {
            let leaderboard = []
            const dataArray = snapshot.val()
            for (let i = 0 ; i < dataArray.length; i++) { 
                leaderboard.push(dataArray[i])
            }           
            return leaderboard
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error(error);
      });   
      
    return data
}