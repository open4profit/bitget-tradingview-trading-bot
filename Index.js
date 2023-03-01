const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const dotenv = require("dotenv");
dotenv.config();
const {
    FuturesClient,
} = require('bitget-api');

const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;
const API_PASS = process.env.API_PASS;

const bitget = require('bitget-openapi');
const client = {
    futuresAccount: new bitget.MixAccountApi(API_KEY, API_SECRET, API_PASS),
    futuresOrder: new bitget.MixOrderApi(API_KEY, API_SECRET, API_PASS),
    futuresPosition: new bitget.MixPlanApi(API_KEY, API_SECRET, API_PASS),
    futuresMarket: new bitget.MixMarketApi(API_KEY, API_SECRET, API_PASS)
}

module.exports = client




const futuresClient = new FuturesClient({
    apiKey: API_KEY,
    apiSecret: API_SECRET,
    apiPass: API_PASS,
}, );



//beta
const replaceMultipler = (number, decimals, multipler) => {
    number = number.toString()
    var result = number.includes('.') ? number.split('.')[1] : ''
    if (result.length == decimals) {
        result = result.slice(0, -1) + multipler
        result = (number.includes('.')
            ? number.split('.')[0] : number) + '.' + result
    } else {
        result = number
    }

    return result
}


async function setLeverage(symbol, marginCoin, leverage) {
    try {
        const response = await futuresClient.postPrivate('/api/mix/v1/account/setLeverage', {
            symbol,
            marginCoin,
            leverage,
        });
        console.log(response);
    } catch (error) {
        console.error(error);
    }
}

async function submitTrailingStopOrder(order) {
    try {
        const response = await futuresClient.postPrivate('/api/mix/v1/plan/placeTrailStop', order);
        console.log(response);
    } catch (error) {
        console.error(error);
    }
}

async function myFunction(order, res) {
    await setLeverage(order.symbol, order.marginCoin, order.leverage);
    //await submitTrailingStopOrder(order);
    futuresClient.submitOrder(order)
        .then(result => {
            console.log("postNewFuturesOrder result: ", result);
            res.status(201).json(result);
        })
        .catch(err => {
            console.error("postNewFuturesOrder error: ", err);
        });
}


app.post('/api/v1/placeorder', async (req, res) => {
    const PAIR1 = req.body.PAIR1;
    const symbolInfo = (await client.futuresMarket.contracts(`umcbl`))
        .data.filter(item => item.baseCoin === req.body.PAIR1)[0];

    const { pricePlace, multiplier, sizePlace, minSize } = {
        pricePlace: symbolInfo.pricePlace,
        multiplier: symbolInfo.priceEndStep,
        sizePlace: symbolInfo.volumePlace,
        minSize: symbolInfo.minTradeNum
    }

    const cmp = parseFloat(req.body.cmp).toFixed(pricePlace);
    const sl = parseFloat(req.body.sl).toFixed(pricePlace);
    const symbol = req.body.symbol;
    const marginCoin = req.body.marginCoin;
    
    const PAIR2 = req.body.marginCoin;
    const AMOUNT = req.body.AMOUNT;
    const leverage = '10'; //req.body.leverage
    const TAKE_PROFIT_PERCENT = req.body.TAKE_PROFIT_PERCENT;
    const STOP_LOSS_PERCENT  = req.body.STOP_LOSS_PERCENT;
    const orderType = 'market'; // market limit
    if(sl>cmp){
         todo = 'open_short';
    } else {
         todo = 'open_long';
    }
    const side = todo;
    const price = parseFloat(req.body.cmp).toFixed(pricePlace);
    const amountBuyPAIR1  = parseFloat(req.body.AMOUNT * req.body.leverage) / parseFloat(req.body.price);
    const size = parseFloat(amountBuyPAIR1).toFixed(sizePlace);
    //const presetTakeProfitPrice = req.body.presetTakeProfitPrice;
    //const presetStopLossPrice = req.body.presetStopLossPrice;    
    const planType = req.body.planType;
    const rangeRate = req.body.rangeRate;
    const triggerPrice = parseFloat(req.body.triggerPrice).toFixed(pricePlace);
    const triggerType = 'market_price';
    if(sl>cmp){
         tp1 = parseFloat(parseFloat(price) - (parseFloat(price) * (TAKE_PROFIT_PERCENT / leverage) / 100)).toFixed(pricePlace);
         stoploss1 = parseFloat(parseFloat(price) + (parseFloat(price) * (STOP_LOSS_PERCENT / leverage) / 100)).toFixed(pricePlace);
   } else {
        tp1 = parseFloat(parseFloat(price) + (parseFloat(price) * (TAKE_PROFIT_PERCENT / leverage) / 100)).toFixed(pricePlace);
        stoploss1 = parseFloat(parseFloat(price) - (parseFloat(price) * (STOP_LOSS_PERCENT / leverage) / 100)).toFixed(pricePlace);
   }
    const tp = tp1;
    const stoploss = stoploss1;    
    const presetTakeProfitPrice = replaceMultipler(tp, pricePlace, multiplier);    
    const presetStopLossPrice = replaceMultipler(stoploss, pricePlace, multiplier);
    console.log(`presetStopLossPrice: ${stoploss}`);
    console.log(`presetTakeProfitPrice: ${tp}`);
    console.log(`StopLossPrice: ${sl}`);
    console.log(`cmp: ${cmp}`);

    // const symbol = 'SBTCSUSDT_SUMCBL';
    // const marginCoin = 'SUSDT';
    // const orderType = 'limit';
    // const side = 'open_long';
    // const price = '21726';
    // const size = '0.1';
    // const presetTakeProfitPrice = '23000';
    // const presetStopLossPrice = '13000';
    // const leverage = '3';
    // const planType = "moving_plan";
    // const rangeRate = "10";
    // const triggerPrice = "22857";
    
    

    const order = {
        symbol,
        marginCoin,
        orderType,
        side,
        price,
        size,
        presetTakeProfitPrice,
        presetStopLossPrice,
        leverage,
        planType,
        rangeRate,
        triggerPrice,
        triggerType
    };
    myFunction(order, res)

});


app.get('/', (req, res) => {
    res.send("hello")
});


const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
