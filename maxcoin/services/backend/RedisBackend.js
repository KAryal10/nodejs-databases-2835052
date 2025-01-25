/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-empty-function */
const Redis = require('ioredis');
const CoinAPI = require('../CoinAPI');


class RedisBackend {

  constructor() {
    this.coinAPI = new CoinAPI();
    this.client = null;
  }

  connect() {
    this.client = new Redis(7379);
    return this.client;
  }

  async disconnect() {
    return this.client.disconnect();
  }

  async insert() {
    const data = this.coinAPI.fetch();

    if (!data.bpi) {
      throw new Error('Failed to fetch data from CoinAPI');
    }

    const values = [];
    Object.entries(data.bpi).forEach((entries) => {
      values.push(entries[1]);
      values.push(entries[0]);
    });
    return this.client.zadd('maxcoin:values', values);
  }

  async getMax() {
    return this.client.zrange('maxcoin:values', -1, -1, 'WITHSCORES');
  }

  async max() {
    console.info('Connecting to Redis...');
    console.time('Redis connect');
    const client = this.connect();
    if (client) {
      console.info('Connected to Redis');
    }
    else {
      throw new Error('Failed to connect to Redis');
    }
    console.timeEnd('Redis connect');

    console.info('inserting data...');
    console.time('Redis insert');
    const insertResult = await this.insert();
    console.timeEnd('Redis insert');

    console.info(`Inserted ${insertResult} documents`);

    console.info('fetching max value...');
    console.time('Redis fetch max');
    const result = await this.getMax();
    console.timeEnd('Redis fetch max');

    console.info('disconnecting from Redis...');
    console.time('Redis disconnect');
    await this.disconnect();
    console.timeEnd('Redis disconnect');

    return result;
  }
}

module.exports = RedisBackend;