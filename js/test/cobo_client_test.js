import 'mocha';
const assert = require('assert');
const sleep = require('sleep');
const CoboClient = require('../cobo_client');

const coins = ['LONT_ONT', 'LONT_ONG'];

const api_withdraw_key = process.env.COBO_WITHDRAW_KEY;
const api_withdraw_secret = process.env.COBO_WITHDRAW_SECRET;

assert (api_withdraw_key && api_withdraw_secret);

const coboClient = new CoboClient(api_withdraw_key, api_withdraw_secret, 'hmac', 'https://api.sandbox.cobo.com');

function random_str() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

describe('CoboClient', function() {
    describe('newAddress', function() {
        it('should return the address for each coin', async function() {
            coins.forEach(async function(coin) {
                const result = await coboClient.newAddress(coin);
                assert(result['success'] === true);
                assert(result['result']['coin'] === coin);
                assert(result['result']['address']);
            });
        });

        it('should return error if coin does not exist', function() {
            coboClient.newAddress('XXXXXXXX').then(result => {
                assert(result['success'] === false);
            });
        });
    });

    describe('testCoin', function() {
        it('should return test coin', async function(){
            coins.forEach(async function(coin){
                const result = await coboClient.newAddress(coin);
                const address = result['result']['address'];
                const result1 = await coboClient.testCoin(coin, address, 100000000);
                assert(result['success'] === true);
            });
        });

        it('should return error if coin does not exist', function(){
            coins.forEach(async function(coin){
                const result = await coboClient.newAddress(coin);
                const address = result['result']['address'];
                coboClient.testCoin('XXXXXXXX', address, 100000000).then(result => {
                    assert(result['success'] === false);
                });
            });
        });
    });

    describe('txHistories', function() {
        it('should return success for valid request', async function() {
            coins.forEach(async function(coin){
                const result = await coboClient.txHistories(coin);
                assert(result['success'] === true);
            });
        });

    describe('withdrawRequest', function() {
        it('should return success for valid request', async function() {
            coins.forEach(async function(coin){
                // allocate new address
                const result = await coboClient.newAddress(coin);
                const address = result['result']['address'];
                // deposit to address
                const result1 = await coboClient.testCoin(coin, address, 100000000);
                assert(result1['success'] === true);
                let balanceAvailable = false;
                while(!balanceAvailable) {
                    const histories = await coboClient.txHistories(coin, 'deposit', address);
                    assert(histories['success'] === true);
                    if (histories['result'] === undefined || histories['result'].length === 0) {
                        console.log('Waiting 3 seconds for deposit balance to be available');
                        sleep.sleep(5);
                    } else {
                        console.log("Deposit balance available %s", histories['result'][0]['amount']);
                        balanceAvailable = true;
                    }
                }
                // withdraw from address
                const request_id = random_str();
                const result2 = await coboClient.newAddress(coin);
                const address2 = result2['result']['address'];
                const result3 = await coboClient.withdrawRequest(coin, request_id, address2, 50000000);
                assert(result3['success'] === true);
            });
        });

    //     it('should return success for an address within the same wallet');
    //
    //     it('should return error for invalid address');
    //
    //     it('should return error for existing request_id');
    //
    //     it('should return error for amount of zero');
    //
    //     it('should return error for negative amount');
    //
    //     it('should return error if amount exceeds the balance', function() {
    //
        });
    });

    // describe('withdrawInfo', function() {
    // });
});
