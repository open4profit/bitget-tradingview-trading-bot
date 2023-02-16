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
    await submitTrailingStopOrder(order);
    futuresClient.submitOrder(order)
        .then(result => {
            console.log("postNewFuturesOrder result: ", result);
            res.status(201).json(result);
        })
        .catch(err => {
            console.error("postNewFuturesOrder error: ", err);
        });
}


app.post('/api/v1/placeorder', (req, res) => {
    const symbol = req.body.symbol;
    const marginCoin = req.body.marginCoin;
    const PAIR1 = req.body.PAIR1;
    const PAIR2 = req.body.marginCoin;
    const AMOUNT = req.body.AMOUNT;
    const TAKE_PROFIT_PERCENT = req.body.TAKE_PROFIT_PERCENT;
    const STOP_LOSS_PERCENT  = req.body.STOP_LOSS_PERCENT ;
    const orderType = req.body.orderType;
    const side = req.body.side;
    const price = req.body.price;
    const size = req.body.size;
    //const presetTakeProfitPrice = req.body.presetTakeProfitPrice;
    //const presetStopLossPrice = req.body.presetStopLossPrice;
    const leverage = req.body.leverage;
    const planType = req.body.planType;
    const rangeRate = req.body.rangeRate;
    const triggerPrice = req.body.triggerPrice;
    const triggerType = 'market_price';

   // var tp = parseFloat(parseFloat(price) + (parseFloat(price) * TAKE_PROFIT_PERCENT / 100)).toFixed(2)

   // var sl = parseFloat(parseFloat(price) - (parseFloat(price) * STOP_LOSS_PERCENT / 100)).toFixed(2)
    const presetTakeProfitPrice = price + (price * TAKE_PROFIT_PERCENT / 100).toFixed(2);
    const presetStopLossPrice =  price - (price * STOP_LOSS_PERCENT / 100).toFixed(2);
   
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
