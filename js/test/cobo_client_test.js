import 'mocha';
const assert = require('assert');
const sleep = require('sleep');
const CoboClient = require('../cobo_client');

// const coins = ['LONT_ONG', 'LONT_ONG'];
// const request_ids = {'LONT_ONT': '', 'LONT_ONG': ''};

const coins = ['LONT_ONG'];
let request_ids = {'LONT_ONG': ''};
let addresses = {'LONT_ONG': ''};

const api_withdraw_key = process.env.COBO_WITHDRAW_KEY;
const api_withdraw_secret = process.env.COBO_WITHDRAW_SECRET;

const api_query_key = process.env.COBO_QUERY_KEY;
const api_query_secret = process.env.COBO_QUERY_SECRET;

assert (api_withdraw_key && api_withdraw_secret && api_query_key && api_query_secret);

const coboWithdrawClient = new CoboClient(api_withdraw_key, api_withdraw_secret, 'hmac', 'https://api.sandbox.cobo.com');
const coboQueryClient = new CoboClient(api_query_key, api_query_secret, 'hmac', 'https://api.sandbox.cobo.com');

function random_str() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}


describe('CoboClient', function() {
    describe('newAddress', function() {
        it('should return the address for each coin', async function() {
            coins.forEach(async function(coin) {
                const result = await coboQueryClient.newAddress(coin);
                assert(result['success'] === true);
                assert(result['result']['coin'] === coin);
                assert(result['result']['address']);
            });
        });

        it('should return error if coin does not exist', function() {
            coboQueryClient.newAddress('XXXXXXXX').then(result => {
                assert(result['success'] === false);
            });
        });
    });

    describe('testCoin', function() {
        it('should return test coin', async function(){
            coins.forEach(async function(coin){
                const result = await coboQueryClient.newAddress(coin);
                addresses[coin] = result['result']['address'];
                const result1 = await coboQueryClient.testCoin(coin, addresses[coin], 1);
                assert(result['success'] === true);
            });
        });

        it('should return error if coin does not exist', function(){
            coins.forEach(function(coin){
                coboQueryClient.testCoin('XXXXXXXX', addresses[coin], 1).then(result => {
                    assert(result['success'] === false);
                });
            });
        });
    });

    // describe('withdrawRequest', function() {
    //     it('should return success for an address outside the wallet', function() {
    //         for (let coin in coins) {
    //             const request_id = random_str();
    //             request_ids['coin'] = request_id;
    //             const address = btc_address;
    //             const amount = 0.1;
    //             coboClient.withdrawRequest(coin, request_id, address, amount).then(response => {
    //                 const result = JSON.parse(response);
    //                 assert(result['success'] === true);
    //             });
    //         }
    //         coboClient.withdrawRequest()
    //     });
    //
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
    //     });
    // });
    //
    // describe('withdrawInfo', function() {
    // });
});
