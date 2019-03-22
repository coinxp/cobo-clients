const crypto = require('crypto');
const sha256 = require('sha256');
const bip66 = require('bip66');
const fetch = require('node-fetch');
const loglevel = require('loglevel');
const ec = new require('elliptic').ec('secp256k1');

const ZERO = Buffer.alloc(1, 0);

class CoboClient {

    constructor(api_key, api_secret, sig_type = 'hmac', host = 'https://api.sandbox.cobo.com') {
        this.api_key = api_key;
        this.api_secret = api_secret;
        this.sig_type = sig_type;
        this.host = host;
        this.logger = loglevel.getLogger(`cobo-client-logger`);
        this.logger.setLevel('info')
    }

    static toDER(x) {
        let i = 0;
        while (x[i] === 0) ++i;
        if (i === x.length) return ZERO;
        x = x.slice(i);
        if (x[0] & 0x80) return Buffer.concat([ZERO, x], 1 + x.length);
        return x
    }

    sign_ecc(message) {
        let privateKey = Buffer.from(this.api_secret, 'hex');
        let result = ec.sign(Buffer.from(sha256.x2(message), 'hex'), privateKey);
        let r = new Buffer(result.r.toString(16, 64), 'hex');
        let s = new Buffer(result.s.toString(16, 64), 'hex');
        r = CoboClient.toDER(r);
        s = CoboClient.toDER(s);
        return bip66.encode(r, s).toString('hex');
    };

    sign_hmac(message) {
        this.logger.debug(message);
        let x = crypto.createHmac('sha256', this.api_secret)
            .update(message)
            .digest('hex');
        this.logger.debug(x);
        return x
    };

    async newAddress(coin) {
        const params = {
            'coin': coin
        };
        return await this.coboFetch('POST', '/v1/custody/new_address/', params);
    }

    async withdrawRequest(coin, request_id, address, amount, memo, fee, gaslimit, gasprice) {
        const params = {
            'coin': coin,
            'request_id': request_id,
            'address': address,
            'amount': amount,
            'memo': memo,
            'fee': fee,
            'gaslimit': gaslimit,
            'gasprice': gasprice
        };
        return await this.coboFetch('POST', '/v1/custody/new_withdraw_request/', params);
    }

    async withdrawInfo(request_id) {
        const params = {
            'request_id': request_id
        };
        return await this.coboFetch('GET', '/v1/custody/withdraw_info_by_request_id/', params);
    }

    async testCoin(coin, address, amount) {
        const params = {
            'coin': coin,
            'address': address,
            'amount': amount
        };
        return await this.coboFetch('POST', '/v1/custody/faucet_test_coin/', params);
    }

    async coboFetch(method, path, params) {
        this.logger.info('Received %s request on path %s with params %s.', method, path, JSON.stringify(params));
        let nonce = String(new Date().getTime());
        let sort_params = Object.keys(params).sort().map((k) => {
            return k + '=' + encodeURIComponent(params[k]).replace(/%20/g, '+');
        }).join('&');
        let content = [method, path, nonce, sort_params].join('|');
        let signature = '';
        if (this.sig_type === 'ecdsa') {
            signature = this.sign_ecc(content)
        } else if (this.sig_type === 'hmac') {
            signature = this.sign_hmac(content)
        } else {
            throw "unexpected sig_type " + this.sig_type;
        }

        let headers = {
            'Biz-Api-Key': this.api_key,
            'Biz-Api-Nonce': nonce,
            'Biz-Api-Signature': signature
        };

        if (method === 'GET') {
            const result = await fetch(this.host + path + '?' + sort_params, {
                'method': method,
                'headers': headers,
            });
            this.logger.info("Processed %s request on path %s with params %s and returned %s.",
                method, path, JSON.stringify(params), JSON.stringify(result));
            return result;
        } else if (method === 'POST') {
            headers['Content-Type'] = "application/x-www-form-urlencoded";
            const result = await fetch((this.host + path), {
                'method': method,
                'headers': headers,
                'body': sort_params
            });
            const json = await result.json();
            this.logger.info("Processed %s requerst on path %s with params %s and returned %s.",
                method, path, JSON.stringify(params), JSON.stringify(json));
            return json;
        } else {
            throw "unexpected method " + method;
        }
    };
}

module.exports = CoboClient;