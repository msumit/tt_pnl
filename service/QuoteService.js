const fetch = require('node-fetch');
//const IMG = `https://picsum.photos/400?t=${new Date().getTime()}`;
const IMG = `https://source.unsplash.com/400x400/?river,forest,inspire,strong,nature,space,stars,dream,run,hike&t=${Math.random()}`;

async function GetQuoteOfDay(options) {
    
    //Zenquotes
    let quotePromise = await fetch('https://zenquotes.io/api/today');
    let result = await quotePromise.json();
    let q = result[0];
    if (q) {
        return {title: 'Quote of the Day', quote:q.q, author:q.a, image: IMG};
    } else 
        return null;

    //quotes.rest
    // let quotePromise = await fetch('https://quotes.rest/qod');
    // let result = await quotePromise.json();
    // let q = result.contents.quotes[0];
    // return {title: q.title, quote:q.quote, author:q.author, image: imageUrl}
    
}
module.exports.GetQuoteOfDay = GetQuoteOfDay;