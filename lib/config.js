"use strict";

class Config{

    constructor(config){
        this.config = config;
    }

    isSuportedServer(source){
        return source.indexOf(this.config.proget.server) > -1;
    }

}

module.exports = {
    createConfig: function (config) {
        return new Config(config);
    }
};