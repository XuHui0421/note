//axios请求超时,设置重新请求

import Vue from 'vue'
import Axios from 'axios'
import {baseUrl} from './connection.js'
import {Message} from 'element-ui'
import cookie from '../assets/js/utils'
import router from '../router'

//设置全局的请求次数，请求的间隙
Axios.defaults.retry = 4;
Axios.defaults.retryDelay = 1000;


const instance2 = Axios.create({
  baseURL: baseUrl,//"http://47.93.28.3:9002/scf/",
  headers: {
    "Content-Type": "application/json",
    'X-Requested-With': 'XMLHttpRequest'
  }
});

instance2.interceptors.request.use(config => {
    let user = JSON.parse(cookie.getCookie("user"));
    if (user) {
      config.params ? config.params.uid = user.uid : config.params = {
        uid: user.uid
      };
    }

    return config;
  },
  err => {
    return Promise.reject(err);
  });
  
instance2.interceptors.response.use(function (response) {
    if (response.data.status == 200) {
      return response.data;
    } else if (response.data.status == 403) { //用户身份过期
      Message.error(response.data.errorMessage);
      router.push({
        path: '/login'
      }); //跳转到登录页面
      cookie.delCookie("user"); //清空用户信息   
      return Promise.reject(response);
    } else {
      Message.error(response.data.errorMessage);
      return Promise.reject(response.data);
    }
  },
  function axiosRetryInterceptor(err) {
    var config = err.config;
    // If config does not exist or the retry option is not set, reject
    if(!config || !config.retry) return Promise.reject(err);
    
    // Set the variable for keeping track of the retry count
    config.__retryCount = config.__retryCount || 0;
    
    // Check if we've maxed out the total number of retries
    if(config.__retryCount >= config.retry) {
        // Reject with the error
        return Promise.reject(err);
    }
    
    // Increase the retry count
    config.__retryCount += 1;
    
    // Create new promise to handle exponential backoff
    var backoff = new Promise(function(resolve) {
        setTimeout(function() {
            resolve();
        }, config.retryDelay || 1);
    });
    
    // Return the promise in which recalls axios to retry the request
    return backoff.then(function() {
        return axios(config);
    });
});
Vue.prototype.$axios = instance2;

//参考地址：https://github.com/axios/axios/issues/164#issuecomment-327837467
