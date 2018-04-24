module.exports =  {
    SUCCESS: 0,                 //执行成功
    COMMONS_PARAMS_LACK: 1,     //请求参数缺失
    COMMONS_SIGN_NOT_CORRECT: 3,//签名校验失败
    USER_NOT_LOGIN: 3,          //用户未登录 
    PARAM_VALUE_ERROR: 4,       //请求错误
    ERROR: 5,                   //请求失败
    USER_IS_EXIST: 6,           //该用户已注册过
    USER_LOGIN_ERROR: 7,        //登陆失败,用户名或密码错误
    CODE_ERROR: 8,              //验证码错误
    CODE_EXPIRE: 9              //验证码过期
}

// SUCCESS(0, "执行成功"),
// COMMONS_PARAMS_LACK(1, "请求参数缺失"),
// COMMONS_SIGN_NOT_CORRECT(2, "签名校验失败"),
// USER_NOT_LOGIN(3, "用户未登录"),
// PARAM_VALUE_ERROR(4, "请求错误"), //参数值错误
// ERROR(5, "请求失败"), //参数值错误
// USER_IS_EXIST(6, "该用户已注册过"), //
// USER_LOGIN_ERROR(7, "登陆失败,用户名或密码错误"), //
// CODE_ERROR(8, "验证码错误"), //
// CODE_EXPIRE(9, "验证码过期"), //
// ADVERT_NOT_FOUND(10, "获取广告数据错误"), //
// NEED_REALNAME(11, "需要实名"), //
// MARKET_PRICE_CHANGE(12, "市场价格变化"), //
// LOWER_THAN_PRICE(13, "低于广告最低价格"), //
// HIGHER_THAN_PRICE(14, "大于广告最高价格"), //
// NOT_ALLOW_SAME_USER_ORDER(15, "非法下单"), //不能下自己的订单
// SET_ORDER_STATUS_ERROR(16, "不允许设置订单状态"), //不能下自己的订单
// TRADE_ORDER_NOT_FOUND(17, "获取交易订单失败"), //不能下自己的订单
// PWD_ERROR(18, "密码不正确"), //密码不正确
// TRADE_ORDER_FROZEN_ERROR(19, "下单失败"), //下单失败 卖家账户问题
// RELEASE_ORDER_FOR_TRANC_ERROR(20, "释放币失败"), //调内部转账失败
// RESET_PWD_ERROR(21, "重置密码失败"), //重置密码失败
// USER_NAME_IS_EXIST(22, "该用户名已注册"), //
// TRADE_AMOUNT_ERROR(23,"金额跟币数不匹配"),
// SET_TRADE_ORDER_CANCEL_UNFREZEN_ERROR(24, "取消订单失败"), //取消订单失败 原因解冻资金失败
// NO_NEED_UPDATE_CLIENT(25, "该版本为最新版本"), //
// NEED_UPDATE_CLIENT(26, "有新版本"), //