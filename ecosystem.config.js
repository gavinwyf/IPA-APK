module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [

    // First application
    {
      name      : 'ipapk',
      script    : 'ipapk-server.js',
      watch: ['web'], // 默认关闭watch 可替换为 ['web']
      ignore_watch: ['node_modules', 'build', 'logs'],
      out_file: '/logs/out.log', // 日志输出
      error_file: '/logs/error.log', // 错误日志
      max_memory_restart: '900M', // 超过多大内存自动重启，仅防止内存泄露有意义，需要根据自己的业务设置
      // exec_mode: "fork",  // cluster_mode 集群  默认 fork
      env: {
        COMMON_VARIABLE: 'true'
      },
      env_production : {
        NODE_ENV: 'production'
      }
    },

    // Second application
    {
      name      : 'WEB',
      script    : 'web.js'
    }
  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy : {
    production : {
      user : 'ec2-user',  // ec2-user  root
      host : 'ec2-54-202-198-206.us-west-2.compute.amazonaws.com',
      ref  : 'origin/master',
      repo : 'git@git.iotccoin.com:fe/ipapk.git',
      path : '/var/www/ipapk',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    },
    dev : {
      user : 'node',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/development',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env dev',
      env  : {
        NODE_ENV: 'dev'
      }
    }
  }
};
